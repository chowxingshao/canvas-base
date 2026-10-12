import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import sitemap from '@astrojs/sitemap';
import type { SiteConfig } from '../config/schema.ts';
import type { RouteRecord } from '../routing/types.ts';
import { createArtifactIntegration } from './artifacts.ts';

type DiscoveryRoute = Pick<
  RouteRecord,
  'path' | 'canonicalPath' | 'fallback' | 'alternates'
>;

/** Only the endpoint imports content; this config-side module reads rendered route data. */
export function createDiscoveryIntegrations(
  config: SiteConfig,
): AstroIntegration[] {
  const canonical = new Map<string, DiscoveryRoute>();
  const absolute = (path: string) => new URL(path, config.url).href;
  return [
    {
      name: 'canvas:prepare-discovery',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command === 'build')
            injectRoute({
              pattern: '/__build/routes.json',
              entrypoint: fileURLToPath(
                new URL('../../pages/__build/routes.json.ts', import.meta.url),
              ),
              prerender: true,
            });
        },
        'astro:build:done': async ({ dir }) => {
          canonical.clear();
          const routes: DiscoveryRoute[] = JSON.parse(
            await readFile(new URL('__build/routes.json', dir), 'utf8'),
          );
          for (const route of routes)
            if (!route.fallback && route.path === route.canonicalPath)
              canonical.set(absolute(route.path), route);
        },
      },
    },
    sitemap({
      filter: (url) => canonical.has(url),
      serialize: (item) => {
        const route = canonical.get(item.url);
        if (!route) return undefined;
        return {
          ...item,
          links: route.alternates
            .filter((alternate) => canonical.has(absolute(alternate.path)))
            .map((alternate) => ({
              lang: alternate.locale,
              url: absolute(alternate.path),
            })),
        };
      },
    }),
    createArtifactIntegration(config),
  ];
}
