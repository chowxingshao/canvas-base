import { createHash } from 'node:crypto';
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
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
  if (!within || within === '..' || within.startsWith(`..${sep}`))
    throw new Error(`Generated path escapes project root: ${path}`);
  return target;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function rejectSymlinkAncestors(
  root: string,
  target: string,
): Promise<void> {
  const relativePath = relative(root, target);
  let current = root;
  for (const component of relativePath.split(sep)) {
    current = resolve(current, component);
    if (!(await exists(current))) continue;
    if ((await lstat(current)).isSymbolicLink())
      throw new Error(
        `Generated path crosses a symbolic link: ${relativePath}`,
      );
  }
}

async function loadManifest(root: string): Promise<Manifest> {
  const path = contained(root, manifestPath);
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
  const target = contained(root, path);
  await rejectSymlinkAncestors(root, target);
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
  const additions = new Set<string>();
  const removals = new Set<string>();
  const brief = 'brief.md';
  const briefTarget = contained(root, brief);
  if (!(await exists(briefTarget))) {
    desired.set(
      brief,
      await readFile(contained(root, 'brief.template.md'), 'utf8'),
    );
    additions.add(brief);
  }

  if (options.config.features.i18n) {
    const dictionary = await readFile(
      contained(root, 'src/content/ui.json'),
      'utf8',
    );
    for (const locale of options.config.i18n.locales) {
      const path = `src/i18n/${locale}.json`;
      if (!(await exists(contained(root, path)))) {
        desired.set(path, dictionary);
        additions.add(path);
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
      (await readFile(contained(root, template), 'utf8')).replaceAll(
        '{{BRANCH}}',
        branch,
      ),
    );
    if (!(await exists(contained(root, workflow)))) additions.add(workflow);
  }

  for (const [path, hash] of Object.entries(manifest.files))
    if (desired.has(path) || removals.has(path))
      await readOwned(root, path, hash);

  const created: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  const next = { ...manifest.files };
  for (const path of removals) {
    await rm(contained(root, path));
    delete next[path];
    removed.push(path);
  }
  for (const [path, content] of desired) {
    const target = contained(root, path);
    await rejectSymlinkAncestors(root, target);
    const present = await exists(target);
    if (!present || (await readFile(target, 'utf8')) !== content) {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
      (present ? updated : created).push(path);
    }
    next[path] = sha256(content);
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
