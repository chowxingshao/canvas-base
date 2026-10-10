import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export async function prepareVercelArtifact(
  distDir: string,
  outputDir: string,
): Promise<void> {
  const source = resolve(distDir);
  const output = resolve(outputDir);
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, 'static'), { recursive: true });
  await cp(source, join(output, 'static'), { recursive: true });
  await writeFile(join(output, 'config.json'), '{"version":3}\n');
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  const [distDir, outputDir] = process.argv.slice(2);
  if (!distDir || !outputDir)
    throw new Error(
      'Usage: prepare-vercel <dist-directory> <output-directory>',
    );
  await prepareVercelArtifact(distDir, outputDir);
}
