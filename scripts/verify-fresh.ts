import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const excluded = new Set([
  '.git',
  'node_modules',
  'dist',
  '.astro',
  '.generated',
  '.canvas',
  '.superpowers',
  '.worktrees',
  '.codex',
  '.agents',
  '.aws',
  '.ssh',
  '.cache',
  '.vercel',
  '.netlify',
  '.wrangler',
  'coverage',
  'test-results',
  'playwright-report',
  'tmp',
  'temp',
]);
const marker = '.canvas-fresh-owner';
function included(path: string): boolean {
  const parts = path.split(sep).map((part) => part.toLowerCase());
  if (parts.some((part) => excluded.has(part))) return false;
  if (parts[0] === 'docs' && parts[1] === 'superpowers') return false;
  const name = parts.at(-1) ?? '';
  return (
    name !== marker &&
    !(
      name === '.env' ||
      (name.startsWith('.env.') && name !== '.env.example')
    ) &&
    !/\.(?:pem|key|log|tsbuildinfo)$/.test(name) &&
    ![
      'credentials',
      'credentials.json',
      'secrets.json',
      '.ds_store',
      'thumbs.db',
      '.npmrc',
      '.netrc',
    ].includes(name)
  );
}
function contained(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    !!path && !isAbsolute(path) && path !== '..' && !path.startsWith('..' + sep)
  );
}
async function noSymlinks(path: string): Promise<void> {
  let current = resolve(path);
  while (true) {
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing symlink: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}
async function ownedRoot(root: string): Promise<string> {
  const absolute = resolve(root);
  if (
    dirname(absolute) !== resolve(tmpdir()) ||
    !basename(absolute).startsWith('canvas-fresh-')
  )
    throw new Error('Expected an owned fresh temporary root.');
  await noSymlinks(absolute);
  if (
    (await readFile(join(absolute, marker), 'utf8')) !==
    (await realpath(absolute))
  )
    throw new Error('Fresh temporary root ownership does not match.');
  return absolute;
}
async function sourceFiles(root: string): Promise<string[]> {
  await noSymlinks(root);
  const files: string[] = [];
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const local = relative(root, path);
      if (!included(local)) continue;
      if (entry.isSymbolicLink())
        throw new Error(`Refusing source symlink: ${local}`);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(local);
      else throw new Error(`Unsupported release source: ${local}`);
    }
  }
  await visit(root);
  return files.sort();
}
export async function snapshotReleaseSource(
  root: string,
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const path of await sourceFiles(root))
    hashes[path.split(sep).join('/')] = createHash('sha256')
      .update(await readFile(join(root, path)))
      .digest('hex');
  return hashes;
}
export async function createFreshWorkspace(): Promise<{
  root: string;
  destination: string;
}> {
  const root = await mkdtemp(join(tmpdir(), 'canvas-fresh-'));
  await writeFile(join(root, marker), await realpath(root));
  return { root, destination: join(root, 'Client Sites', 'Test One') };
}
export async function disposeFreshWorkspace(root: string): Promise<void> {
  const absolute = await ownedRoot(root);
  await rm(absolute, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
export async function copyReleaseSource(
  source: string,
  root: string,
  destination: string,
): Promise<void> {
  const absoluteRoot = await ownedRoot(root);
  const target = resolve(destination);
  const origin = resolve(source);
  if (
    !contained(absoluteRoot, target) ||
    target === origin ||
    contained(origin, target) ||
    contained(target, origin)
  )
    throw new Error('Unsafe fresh-copy destination.');
  await noSymlinks(target);
  try {
    await lstat(target);
    throw new Error('Fresh-copy destination must not already exist.');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const files = await sourceFiles(origin);
  await mkdir(target, { recursive: true });
  for (const path of files) {
    const file = join(target, path);
    await mkdir(dirname(file), { recursive: true });
    await copyFile(join(origin, path), file);
  }
}
async function pnpmCommand(): Promise<{ command: string; prefix: string[] }> {
  const executable = process.env.npm_execpath;
  if (executable && /\.(?:m?js|cjs)$/.test(executable))
    return { command: process.execPath, prefix: [executable] };
  if (executable?.endsWith('.exe')) return { command: executable, prefix: [] };
  if (process.platform !== 'win32') return { command: 'pnpm', prefix: [] };
  for (const directory of (process.env.PATH ?? '').split(';')) {
    for (const candidate of [
      join(directory, 'pnpm.exe'),
      join(directory, 'node_modules/pnpm/pnpm.exe'),
    ]) {
      try {
        if ((await lstat(candidate)).isFile())
          return { command: candidate, prefix: [] };
      } catch {
        /* Continue searching PATH. */
      }
    }
  }
  throw new Error(
    'A native pnpm executable is required on Windows; run through pnpm verify:fresh.',
  );
}
async function verifyFresh(): Promise<void> {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const workspace = await createFreshWorkspace();
  console.log(`Fresh-copy destination: ${workspace.destination}`);
  try {
    const original = await snapshotReleaseSource(source);
    await copyReleaseSource(source, workspace.root, workspace.destination);
    const copied = await snapshotReleaseSource(workspace.destination);
    if (JSON.stringify(copied) !== JSON.stringify(original))
      throw new Error('Fresh copy differs from the release source snapshot.');
    const runner = await pnpmCommand();
    for (const args of [
      ['install', '--frozen-lockfile'],
      ['check'],
      ['lint'],
      ['test'],
      ['build'],
    ]) {
      console.log(`Fresh acceptance: pnpm ${args.join(' ')}`);
      await new Promise<void>((resolveRun, reject) => {
        const child = spawn(runner.command, [...runner.prefix, ...args], {
          cwd: workspace.destination,
          shell: false,
          windowsHide: true,
          stdio: 'inherit',
          env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
        });
        child.once('error', reject);
        child.once('close', (code) =>
          code === 0
            ? resolveRun()
            : reject(new Error(`pnpm ${args.join(' ')} exited ${code}.`)),
        );
      });
      if (
        JSON.stringify(await snapshotReleaseSource(workspace.destination)) !==
        JSON.stringify(copied)
      )
        throw new Error(`Copied source changed after pnpm ${args[0]}.`);
      if (
        JSON.stringify(await snapshotReleaseSource(source)) !==
        JSON.stringify(original)
      )
        throw new Error('Original source changed during fresh acceptance.');
    }
    await disposeFreshWorkspace(workspace.root);
    console.log(
      'Fresh-copy acceptance passed: install, check, lint, test, build; copied source needed no edits. Temporary copy removed.',
    );
  } catch (error) {
    console.error(
      `Fresh-copy acceptance FAILED. Retained destination for diagnosis: ${workspace.destination}`,
    );
    throw error;
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  verifyFresh().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
