import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { prepareVercelArtifact } from '../../scripts/prepare-vercel.ts';

const roots: string[] = [];
afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('prepareVercelArtifact', () => {
  it('places a static build in the Build Output API directory with version 3 metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'Client Sites Test One-'));
    roots.push(root);
    const dist = join(root, 'dist');
    const output = join(root, '.vercel', 'output');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(dist, 'nested'), { recursive: true });
    await writeFile(join(dist, 'index.html'), '<h1>Home</h1>');
    await writeFile(join(dist, 'nested', 'asset.txt'), 'asset');

    await prepareVercelArtifact(dist, output);

    expect(await readFile(join(output, 'static', 'index.html'), 'utf8')).toBe(
      '<h1>Home</h1>',
    );
    expect(
      await readFile(join(output, 'static', 'nested', 'asset.txt'), 'utf8'),
    ).toBe('asset');
    expect(
      JSON.parse(await readFile(join(output, 'config.json'), 'utf8')),
    ).toEqual({ version: 3 });
  });
});
