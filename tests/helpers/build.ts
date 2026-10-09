import { spawn } from 'node:child_process';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, resolve, sep, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../../site.config.ts';
import type { SiteConfig } from '../../src/lib/config/schema.ts';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const omitted = new Set([
  '.git',
  '.astro',
  '.superpowers',
  '.worktrees',
  'node_modules',
  'dist',
  'coverage',
]);

export async function exists(
  root: string,
  relativePath: string,
): Promise<boolean> {
  try {
    await access(resolveFixturePath(root, relativePath));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function isOmittedRoot(
  component: string,
  platform: NodeJS.Platform = process.platform,
): boolean {
  return omitted.has(
    platform === 'win32' ? component.toLowerCase() : component,
  );
}

// Resolve and validate without I/O so rejected paths can be tested safely.
export function resolveFixturePath(
  root: string,
  path: string,
  platform: NodeJS.Platform = process.platform,
): string {
  const pathApi = platform === 'win32' ? win32 : posix;
  const target = pathApi.resolve(root, path);
  const withinRoot = pathApi.relative(root, target);
  if (
    pathApi.isAbsolute(withinRoot) ||
    withinRoot === '..' ||
    withinRoot.startsWith('..' + pathApi.sep) ||
    isOmittedRoot(withinRoot.split(pathApi.sep)[0], platform)
  ) {
    throw new Error('Fixture paths must remain inside the temporary project.');
  }
  return target;
}

function deepMerge(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    const previous = result[key];
    result[key] =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      previous &&
      typeof previous === 'object' &&
      !Array.isArray(previous)
        ? deepMerge(
            previous as Record<string, unknown>,
            value as Record<string, unknown>,
          )
        : structuredClone(value);
  }
  return result;
}

export async function buildFixture(
  options: {
    config?: Partial<SiteConfig>;
    content?: Record<string, string>;
  } = {},
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  outputDir: string;
  dispose(): Promise<void>;
}> {
  const root = await mkdtemp(join(tmpdir(), 'canvas-build-'));
  async function dispose() {
    const absolute = resolve(root);
    if (
      dirname(absolute) !== resolve(tmpdir()) ||
      !relative(tmpdir(), absolute).startsWith('canvas-build-')
    ) {
      throw new Error('Refusing to remove an unexpected fixture directory.');
    }
    await rm(absolute, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
  try {
    await cp(projectRoot, root, {
      recursive: true,
      filter: (source) =>
        !isOmittedRoot(relative(projectRoot, source).split(sep)[0]),
    });
    await symlink(
      join(projectRoot, 'node_modules'),
      join(root, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    if (options.config) {
      const config = deepMerge(siteConfig, options.config);
      await writeFile(
        join(root, 'site.config.ts'),
        `export const siteConfig = ${JSON.stringify(config, null, 2)};\n`,
      );
    }
    for (const [path, contents] of Object.entries(options.content ?? {})) {
      const target = resolveFixturePath(root, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, contents);
    }
    // Each fixture owns its caches; the shared dependency junction stays read-only.
    await rename(
      join(root, 'astro.config.mjs'),
      join(root, 'astro.fixture.config.mjs'),
    );
    await writeFile(
      join(root, 'astro.config.mjs'),
      `import { fileURLToPath } from 'node:url';
import original from './astro.fixture.config.mjs';
export default { ...original, cacheDir: fileURLToPath(new URL('./.astro/cache/', import.meta.url)), vite: { ...original.vite, cacheDir: fileURLToPath(new URL('./.astro/vite-cache/', import.meta.url)) } };
`,
    );
    const output = await new Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
    }>((resolveResult, reject) => {
      const child = spawn(
        process.execPath,
        [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: root,
          env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
          timeout: 120_000,
          windowsHide: true,
        },
      );
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
      child.on('error', reject);
      child.on('close', (code) =>
        resolveResult({ exitCode: code ?? 1, stdout, stderr }),
      );
    });
    return { ...output, outputDir: join(root, 'dist'), dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
