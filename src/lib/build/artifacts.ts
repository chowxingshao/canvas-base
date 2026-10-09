import { copyFile, rm, rmdir } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import type { SiteConfig } from '../config/schema.ts';
import { feedEnabled } from '../seo/feed.ts';

export async function finalizeArtifacts(
  outputDir: URL,
  config: SiteConfig,
): Promise<void> {
  try {
    await copyFile(
      new URL('sitemap-index.xml', outputDir),
      new URL('sitemap.xml', outputDir),
    );
    if (!feedEnabled(config))
      await rm(new URL('rss.xml', outputDir), { force: true });
  } finally {
    await rm(new URL('__build/routes.json', outputDir), { force: true });
    // Never recursively delete an unexpected directory or other build data.
    await rmdir(new URL('__build/', outputDir));
  }
}
export function createArtifactIntegration(
  config: SiteConfig,
): AstroIntegration {
  return {
    name: 'canvas:finalize-artifacts',
    hooks: {
      'astro:build:done': async ({ dir }) => finalizeArtifacts(dir, config),
    },
  };
}
