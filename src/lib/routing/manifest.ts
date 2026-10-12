import { getSiteConfig } from '../config/site.ts';
import type { SiteConfig } from '../config/schema.ts';
import {
  getEntryLocale,
  getPublishedEntries,
  type ContentEntry,
  type CollectionName,
} from '../content/entries.ts';
import { enabledLocales, localePath, withBase } from './paths.ts';
import type { RouteRecord } from './types.ts';

const collections: CollectionName[] = ['pages', 'posts', 'projects'];
const kinds = { pages: 'page', posts: 'post', projects: 'project' } as const;

function entryPath(collection: CollectionName, slug: string): string {
  if (collection === 'pages') return slug === 'home' ? '/' : `/${slug}/`;
  return `/${collection === 'posts' ? 'blog' : 'projects'}/${slug}/`;
}

// Content paths are unmounted identities; append base after locale normalization.
// This preserves a legal slug equal to the base (e.g. /demo/demo/).
function contentPath(path: string, locale: string, config: SiteConfig): string {
  return (
    withBase('/', config).replace(/\/$/, '') +
    localePath(path, locale, { ...config, base: '/' })
  );
}

export function buildRouteManifest(
  entries: ContentEntry[],
  config: SiteConfig,
  warn: (message: string) => void,
): RouteRecord[] {
  const locales = enabledLocales(config);
  const { defaultLocale } = config.i18n;
  const routes: RouteRecord[] = [];
  const identities = new Map<string, Map<string, ContentEntry>>();
  const reserved = new Set(['blog', 'projects', '__build', ...locales]);
  for (const entry of entries) {
    const locale = getEntryLocale(entry);
    if (!config.i18n.locales.includes(locale))
      throw new Error(
        `Unknown locale: ${locale} (${entry.collection}/${entry.data.slug}).`,
      );
    if (
      !locales.includes(locale) ||
      entry.data.draft ||
      (entry.collection === 'pages' && entry.data.slug === 'not-found')
    )
      continue;
    if (
      (entry.collection === 'posts' && !config.features.blog) ||
      (entry.collection === 'projects' && !config.features.projects)
    )
      continue;
    const { slug } = entry.data;
    if (entry.collection === 'pages' && reserved.has(slug))
      throw new Error(
        `Route collision: pages/${slug} is a reserved page slug.`,
      );
    const key = `${entry.collection}/${slug}`;
    const translations = identities.get(key) ?? new Map<string, ContentEntry>();
    if (translations.has(locale))
      throw new Error(
        `Route collision: ${key} (${locale}) has duplicate published entries.`,
      );
    translations.set(locale, entry);
    identities.set(key, translations);
  }
  // Insertion order retains the content helpers' publication order.
  for (const [key, translations] of identities) {
    const sample = translations.values().next().value!;
    const { collection } = sample;
    const { slug } = sample.data;
    const path = entryPath(collection, slug);
    const alternates = locales
      .filter((locale) => translations.has(locale))
      .map((locale) => ({ locale, path: contentPath(path, locale, config) }));
    for (const locale of locales) {
      const translated = translations.get(locale);
      const source = translated ?? translations.get(defaultLocale);
      if (!source) continue;
      const fallback = !translated;
      if (fallback)
        warn(
          `Missing translation: ${key} (${locale}); using ${defaultLocale}.`,
        );
      const contentLocale = getEntryLocale(source);
      routes.push({
        kind: kinds[collection],
        slug,
        path: contentPath(path, locale, config),
        locale,
        contentLocale,
        fallback,
        entry: source,
        canonicalPath: contentPath(path, contentLocale, config),
        alternates,
      });
    }
  }
  for (const collection of ['posts', 'projects'] as const) {
    if (
      !(collection === 'posts'
        ? config.features.blog
        : config.features.projects)
    )
      continue;
    const path = collection === 'posts' ? '/blog/' : '/projects/';
    const alternates = locales.map((locale) => ({
      locale,
      path: contentPath(path, locale, config),
    }));
    for (const locale of locales) {
      const localizedPath = contentPath(path, locale, config);
      routes.push({
        kind: collection === 'posts' ? 'post-index' : 'project-index',
        slug: '',
        path: localizedPath,
        locale,
        contentLocale: locale,
        fallback: false,
        canonicalPath: localizedPath,
        alternates,
      });
    }
  }
  return routes;
}

let manifest: Promise<RouteRecord[]> | undefined;
export function getRouteManifest(): Promise<RouteRecord[]> {
  manifest ??= Promise.all(
    collections.map((collection) => getPublishedEntries(collection)),
  ).then((entries) =>
    buildRouteManifest(entries.flat(), getSiteConfig(), console.warn),
  );
  return manifest;
}
