import rss from '@astrojs/rss';
import { getSiteConfig } from '../lib/config/site.ts';
import { getRouteManifest } from '../lib/routing/manifest.ts';
import { buildFeedItems, feedEnabled } from '../lib/seo/feed.ts';

export const prerender = true;
export async function GET(): Promise<Response> {
  const config = getSiteConfig();
  // Finalization removes this placeholder when the feed is disabled.
  if (!feedEnabled(config))
    return new Response('', { headers: { 'Content-Type': 'application/xml' } });
  return rss({
    title: config.name,
    description: config.description,
    site: new URL(config.base, config.url),
    items: buildFeedItems(await getRouteManifest(), config),
  });
}
