import { getSiteConfig } from '../lib/config/site.ts';
import { withBase } from '../lib/routing/paths.ts';

export const prerender = true;
export function GET(): Response {
  const config = getSiteConfig();
  const sitemap = new URL(withBase('/sitemap.xml', config), config.url).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
