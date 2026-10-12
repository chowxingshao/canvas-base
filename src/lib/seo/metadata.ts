import { parseSiteConfig, type SiteConfig } from '../config/schema.ts';
import { pageStructuredDataSchema } from '../content/schemas.ts';
import { withBase } from '../routing/paths.ts';
import type { RouteRecord } from '../routing/types.ts';
import { serializeJsonLd } from './json-ld.ts';

export type SeoInput = {
  title: string;
  description: string;
  route: RouteRecord;
  image?: string;
  structuredData?: Record<string, unknown>;
};
export type SeoMetadata = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  locale: string;
  alternates: Array<{ locale: string; url: string }>;
  jsonLd?: string;
};

/** Manifest paths already include base. Do not mount them again. */
export function absoluteRouteUrl(path: string, config: SiteConfig): string {
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\s?#]/.test(path)) {
    throw new TypeError('Expected a safe, mounted route path.');
  }
  const url = new URL(path, config.url);
  if (url.origin !== new URL(config.url).origin)
    throw new TypeError('Route must remain on the site origin.');
  return url.href;
}

function absoluteImageUrl(image: string, config: SiteConfig): string {
  const path =
    image.startsWith('/') && !image.startsWith('//')
      ? withBase(image, config)
      : image;
  const url = new URL(path, config.url);
  if (
    (!/^https?:\/\//.test(image) && !image.startsWith('/')) ||
    image.startsWith('//') ||
    /[\\\s]/.test(image) ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new TypeError(
      'Use a root-relative image path or public HTTP(S) URL.',
    );
  }
  return url.href;
}

export function buildMetadata(
  input: SeoInput,
  rawConfig: SiteConfig,
): SeoMetadata {
  const config = parseSiteConfig(rawConfig);
  const { route } = input;
  const canonical = absoluteRouteUrl(route.canonicalPath, config);
  const image = absoluteImageUrl(input.image ?? config.defaultOgImage, config);
  const title =
    input.title === config.name || input.title.endsWith(` | ${config.name}`)
      ? input.title
      : `${input.title} | ${config.name}`;
  let data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.title,
    description: input.description,
    url: canonical,
    inLanguage: route.contentLocale,
  };
  if (
    route.kind === 'post' &&
    route.entry &&
    'publishedAt' in route.entry.data
  ) {
    data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: input.title,
      description: input.description,
      url: canonical,
      mainEntityOfPage: canonical,
      image,
      inLanguage: route.contentLocale,
      datePublished: route.entry.data.publishedAt.toISOString(),
      ...(config.author
        ? { author: { '@type': 'Person', name: config.author } }
        : {}),
    };
  } else if (input.structuredData) {
    const { type, ...identity } = pageStructuredDataSchema.parse(
      input.structuredData,
    );
    data = {
      '@context': 'https://schema.org',
      '@type': type,
      ...identity,
      url: identity.url ?? canonical,
    };
  }
  return {
    title,
    description: input.description,
    canonical,
    image,
    locale: route.locale,
    alternates: route.fallback
      ? []
      : route.alternates.map((alternate) => ({
          locale: alternate.locale,
          url: absoluteRouteUrl(alternate.path, config),
        })),
    jsonLd: serializeJsonLd(data),
  };
}
