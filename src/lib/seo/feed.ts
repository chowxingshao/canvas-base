import type { SiteConfig } from '../config/schema.ts';
import type { RouteRecord } from '../routing/types.ts';
import { absoluteRouteUrl } from './metadata.ts';

export function feedEnabled(config: SiteConfig): boolean {
  return config.features.blog && config.features.rss;
}
export type FeedItem = {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
};
export function buildFeedItems(
  routes: RouteRecord[],
  config: SiteConfig,
): FeedItem[] {
  if (!feedEnabled(config)) return [];
  const items: Array<FeedItem & { slug: string; id: string }> = [];
  const seen = new Set<string>();
  for (const route of routes) {
    const entry = route.entry;
    if (
      route.locale !== config.i18n.defaultLocale ||
      route.fallback ||
      !entry ||
      entry.data.draft ||
      !('publishedAt' in entry.data) ||
      !(
        route.kind === 'post' ||
        (route.kind === 'project' && config.features.projects)
      )
    )
      continue;
    const link = absoluteRouteUrl(route.canonicalPath, config);
    if (seen.has(link)) continue;
    seen.add(link);
    items.push({
      slug: entry.data.slug,
      id: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      link,
      pubDate: entry.data.publishedAt,
    });
  }
  return items
    .sort(
      (first, second) =>
        second.pubDate.getTime() - first.pubDate.getTime() ||
        (first.slug < second.slug ? -1 : first.slug > second.slug ? 1 : 0) ||
        (first.id < second.id ? -1 : first.id > second.id ? 1 : 0),
    )
    .map(({ title, description, link, pubDate }) => ({
      title,
      description,
      link,
      pubDate,
    }));
}
