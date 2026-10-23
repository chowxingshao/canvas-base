import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  copyReleaseSource,
  createFreshWorkspace,
  disposeFreshWorkspace,
  snapshotReleaseSource,
} from '../../scripts/verify-fresh.ts';

const owned: string[] = [];
afterEach(async () => {
  for (const root of owned.splice(0)) await disposeFreshWorkspace(root);
});

describe('fresh release source boundary', () => {
  it('copies authored sources and governance into a directory with spaces without local state or planning evidence', async () => {
    const workspace = await createFreshWorkspace();
    owned.push(workspace.root);
    const source = join(workspace.root, 'Authored Source');
    await mkdir(source);
    for (const path of [
      'src/page.astro',
      'README.md',
      'CLAUDE.md',
      'LICENSE',
      '.github/workflows/ci.yml',
      '.env.example',
      'docs/content.md',
      '.env',
      '.env.production',
      '.npmrc',
      '.netrc',
      '.git/config',
      'node_modules/a.js',
      'dist/index.html',
      '.astro/types.d.ts',
      '.generated/nginx/html/index.html',
      '.canvas/generated.json',
      '.aws/credentials',
      '.ssh/id_rsa',
      '.superpowers/evidence.json',
      'docs/superpowers/plans/plan.md',
      '.cache/cache.json',
      'test-results/report.json',
    ]) {
      const file = join(source, path);
      await mkdir(join(file, '..'), { recursive: true });
      await writeFile(file, path);
    }
    const before = await snapshotReleaseSource(source);
    await copyReleaseSource(source, workspace.root, workspace.destination);
    expect(await snapshotReleaseSource(source)).toEqual(before);
    expect(await snapshotReleaseSource(workspace.destination)).toEqual(before);
    expect(Object.keys(before)).toEqual([
      '.env.example',
      '.github/workflows/ci.yml',
      'CLAUDE.md',
      'LICENSE',
      'README.md',
      'docs/content.md',
      'src/page.astro',
    ]);
    expect(
      await readFile(join(workspace.destination, 'src/page.astro'), 'utf8'),
    ).toBe('src/page.astro');
  });
  it('rejects destinations outside its owned root, inside source, or already populated', async () => {
    const workspace = await createFreshWorkspace();
    owned.push(workspace.root);
    const source = join(workspace.root, 'source');
    await mkdir(source);
    await writeFile(join(source, 'README.md'), 'keep');
    await expect(
      copyReleaseSource(
        source,
        workspace.root,
        join(workspace.root, '..', 'escape'),
      ),
    ).rejects.toThrow();
    await expect(
      copyReleaseSource(source, workspace.root, join(source, 'nested')),
    ).rejects.toThrow();
    await mkdir(workspace.destination, { recursive: true });
    await writeFile(join(workspace.destination, 'authored.md'), 'keep');
    await expect(
      copyReleaseSource(source, workspace.root, workspace.destination),
    ).rejects.toThrow();
    expect(
      await readFile(join(workspace.destination, 'authored.md'), 'utf8'),
    ).toBe('keep');
  });
  it('rejects a source symlink and a destination parent junction before copying', async () => {
    const workspace = await createFreshWorkspace();
    owned.push(workspace.root);
    const source = join(workspace.root, 'source');
    const outside = join(workspace.root, 'outside');
    await mkdir(source);
    await mkdir(outside);
    await writeFile(join(outside, 'secret'), 'keep');
    await symlink(
      outside,
      join(source, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(
      copyReleaseSource(source, workspace.root, workspace.destination),
    ).rejects.toThrow(/symlink/i);
    await rm(join(source, 'linked'));
    await symlink(
      outside,
      join(workspace.root, 'Client Sites'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    await expect(
      copyReleaseSource(source, workspace.root, workspace.destination),
    ).rejects.toThrow(/symlink/i);
    expect(await readFile(join(outside, 'secret'), 'utf8')).toBe('keep');
  });
  it('refuses cleanup of an unowned directory or an owned root through traversal', async () => {
    const workspace = await createFreshWorkspace();
    owned.push(workspace.root);
    await expect(
      disposeFreshWorkspace(join(workspace.root, '..')),
    ).rejects.toThrow();
    const unowned = await mkdtemp(join(tmpdir(), 'canvas-fresh-unowned-'));
    try {
      await expect(disposeFreshWorkspace(unowned)).rejects.toThrow();
    } finally {
      await rm(unowned, { recursive: true });
    }
  });
});
