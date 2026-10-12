import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import type { SiteConfig } from '../src/lib/config/schema.ts';

type Manifest = { files: Record<string, string> };
const manifestPath = '.canvas/generated.json';
const sha256 = (content: string) =>
  createHash('sha256').update(content).digest('hex');

function safeRelative(path: string): void {
  if (
    !path ||
    path.includes('\\') ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error(`Unsafe generated path: ${path}`);
}

function contained(root: string, path: string): string {
  const target = resolve(root, path);
  const within = relative(root, target);
  if (
    !within ||
    isAbsolute(within) ||
    within === '..' ||
    within.startsWith(`..${sep}`)
  )
    throw new Error(`Generated path escapes project root: ${path}`);
  return target;
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function rejectSymlinkAncestors(
  root: string,
  target: string,
): Promise<void> {
  const relativePath = relative(root, target);
  let current = root;
  const components = relativePath.split(sep);
  for (const [index, component] of components.entries()) {
    current = resolve(current, component);
    if (!(await exists(current))) continue;
    const stat = await lstat(current);
    if (stat.isSymbolicLink())
      throw new Error(
        `Generated path crosses a symbolic link: ${relativePath}`,
      );
    if (index < components.length - 1 && !stat.isDirectory())
      throw new Error(
        `Generated path has a non-directory ancestor: ${relativePath}`,
      );
  }
}

async function checkedPath(root: string, path: string): Promise<string> {
  safeRelative(path);
  const target = contained(root, path);
  await rejectSymlinkAncestors(root, target);
  if ((await exists(target)) && !(await lstat(target)).isFile())
    throw new Error(`Generated file path is not a regular file: ${path}`);
  return target;
}

async function loadManifest(root: string): Promise<Manifest> {
  const path = await checkedPath(root, manifestPath);
  if (!(await exists(path))) return { files: {} };
  const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('files' in parsed) ||
    !parsed.files ||
    typeof parsed.files !== 'object' ||
    Array.isArray(parsed.files)
  )
    throw new Error('Invalid generated-file manifest.');
  const files: Record<string, string> = {};
  for (const [path, hash] of Object.entries(parsed.files)) {
    safeRelative(path);
    contained(root, path);
    if (path === manifestPath)
      throw new Error('Generated-file manifest cannot own itself.');
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash))
      throw new Error(`Invalid generated-file hash for ${path}.`);
    files[path] = hash;
  }
  return { files };
}

async function readOwned(
  root: string,
  path: string,
  expected: string,
): Promise<void> {
  const target = await checkedPath(root, path);
  if (
    !(await exists(target)) ||
    sha256(await readFile(target, 'utf8')) !== expected
  )
    throw new Error(
      `Generated file was modified: ${path}. Restore it or remove ownership before rerunning setup.`,
    );
}

function validateBranch(branch: string): void {
  const allowed = /^[A-Za-z0-9._/-]+$/;
  if (
    !allowed.test(branch) ||
    branch.startsWith('-') ||
    branch.startsWith('.') ||
    branch.endsWith('/') ||
    branch.endsWith('.lock') ||
    branch.includes('..') ||
    branch.includes('//') ||
    branch.includes('@{')
  )
    throw new Error(`Invalid branch name: ${branch}`);
}

export async function configureProject(options: {
  root: string;
  config: SiteConfig;
  branch?: string;
}): Promise<{ created: string[]; updated: string[]; removed: string[] }> {
  const root = await realpath(options.root);
  const branch = options.branch ?? 'main';
  validateBranch(branch);
  const manifest = await loadManifest(root);
  const desired = new Map<string, string>();
  const removals = new Set<string>();
  const brief = 'brief.md';
  const briefTarget = await checkedPath(root, brief);
  if (!(await exists(briefTarget))) {
    desired.set(
      brief,
      await readFile(await checkedPath(root, 'brief.template.md'), 'utf8'),
    );
  }

  if (options.config.features.i18n) {
    const dictionary = await readFile(
      await checkedPath(root, 'src/content/ui.json'),
      'utf8',
    );
    for (const locale of options.config.i18n.locales) {
      const path = `src/i18n/${locale}.json`;
      if (!(await exists(await checkedPath(root, path)))) {
        desired.set(path, dictionary);
      }
    }
  } else {
    for (const path of Object.keys(manifest.files))
      if (path.startsWith('src/i18n/')) removals.add(path);
  }

  const workflow = '.github/workflows/deploy.yml';
  if (options.config.features.deploy === 'none') {
    if (manifest.files[workflow]) removals.add(workflow);
  } else {
    const template = `templates/deploy/${options.config.features.deploy}.yml.template`;
    desired.set(
      workflow,
      (await readFile(await checkedPath(root, template), 'utf8')).replaceAll(
        '{{BRANCH}}',
        branch,
      ),
    );
  }

  for (const [path, hash] of Object.entries(manifest.files))
    if (desired.has(path) || removals.has(path))
      await readOwned(root, path, hash);

  // Complete every safety/collision check before the first filesystem mutation.
  const writes: Array<{
    path: string;
    target: string;
    content: string;
    present: boolean;
  }> = [];
  const next = { ...manifest.files };
  for (const path of new Set([...desired.keys(), ...removals])) {
    const target = await checkedPath(root, path);
    const existsAlready = await exists(target);
    if (desired.has(path) && existsAlready && !manifest.files[path])
      throw new Error(
        `Unowned generated file already exists: ${path}. Preserve it and resolve the collision before rerunning setup.`,
      );
    if (desired.has(path)) {
      const content = desired.get(path)!;
      if (!existsAlready || (await readFile(target, 'utf8')) !== content)
        writes.push({ path, target, content, present: existsAlready });
      next[path] = sha256(content);
    }
  }

  const created: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  for (const path of removals) {
    await rm(contained(root, path));
    delete next[path];
    removed.push(path);
  }
  for (const { path, target, content, present } of writes) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    (present ? updated : created).push(path);
  }
  if (Object.keys(next).length) {
    const target = contained(root, manifestPath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify({ files: next }, null, 2)}\n`);
  } else if (await exists(contained(root, manifestPath))) {
    await rm(contained(root, manifestPath));
  }
  return { created, updated, removed };
}
