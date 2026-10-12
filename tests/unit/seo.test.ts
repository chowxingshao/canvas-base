import { describe, expect, it } from 'vitest';
import type { RouteRecord } from '../../src/lib/routing/types.ts';
import type { ContentEntry } from '../../src/lib/content/entries.ts';
import { buildMetadata } from '../../src/lib/seo/metadata.ts';
import { serializeJsonLd } from '../../src/lib/seo/json-ld.ts';
import { buildFeedItems, feedEnabled } from '../../src/lib/seo/feed.ts';
import { buildRouteManifest } from '../../src/lib/routing/manifest.ts';
import { withFeatures } from '../helpers/config.ts';

const config = withFeatures({});
const route: RouteRecord = {
  kind: 'page',
  slug: 'about',
  path: '/demo/about/',
  canonicalPath: '/demo/about/',
  locale: 'en',
  contentLocale: 'en',
  fallback: false,
  alternates: [
    { locale: 'en', path: '/demo/about/' },
    { locale: 'ms', path: '/demo/ms/about/' },
  ],
};
const input = { title: 'About', description: 'About this site.', route };
const publication = (
  collection: 'posts' | 'projects',
  locale: string,
  slug: string,
  date: string,
  draft = false,
): ContentEntry => ({
  id: `${locale}/${slug}`,
  collection,
  body: '<script>body is never rendered</script>',
  data: {
    title: slug,
    description: 'Plain & text',
    slug,
    draft,
    publishedAt: new Date(date),
  },
});

describe('metadata', () => {
  it('derives identity and absolute mounted URLs without mounting route paths twice', () => {
    const metadata = buildMetadata(input, {
      ...config,
      name: 'Example',
      base: '/demo/',
    });
    expect(metadata).toMatchObject({
      title: 'About | Example',
      description: 'About this site.',
      canonical: 'https://example.com/demo/about/',
      image: 'https://example.com/demo/og-default.png',
      locale: 'en',
    });
    expect(metadata.alternates).toEqual([
      { locale: 'en', url: 'https://example.com/demo/about/' },
      { locale: 'ms', url: 'https://example.com/demo/ms/about/' },
    ]);
    expect(JSON.parse(metadata.jsonLd!)).toMatchObject({
      '@type': 'WebPage',
      name: 'About',
      url: metadata.canonical,
    });
    expect(
      buildMetadata(
        {
          ...input,
          route: {
            ...route,
            path: '/demo/demo/',
            canonicalPath: '/demo/demo/',
          },
        },
        { ...config, base: '/demo/' },
      ).canonical,
    ).toBe('https://example.com/demo/demo/');
  });
  it.each(['Canvas Base', 'About | Canvas Base'])(
    'does not duplicate a site title in %s',
    (title) => {
      expect(buildMetadata({ ...input, title }, config).title).toBe(title);
    },
  );
  it('canonicalizes fallbacks to their source and emits no alternate links', () => {
    const metadata = buildMetadata(
      {
        ...input,
        route: {
          ...route,
          path: '/demo/ms/about/',
          locale: 'ms',
          fallback: true,
        },
      },
      { ...config, base: '/demo/' },
    );
    expect(metadata.canonical).toBe('https://example.com/demo/about/');
    expect(metadata.locale).toBe('ms');
    expect(metadata.alternates).toEqual([]);
  });
  it('accepts absolute and mounted local images and rejects unsafe URLs', () => {
    expect(
      buildMetadata(
        { ...input, image: 'https://cdn.example.com/cover.png' },
        config,
      ).image,
    ).toBe('https://cdn.example.com/cover.png');
    expect(
      buildMetadata(
        { ...input, image: '/demo/_astro/cover.png' },
        { ...config, base: '/demo/' },
      ).image,
    ).toBe('https://example.com/demo/_astro/cover.png');
    for (const image of [
      'javascript:alert(1)',
      '//evil.example/cover.png',
      'https://user:pass@example.com/cover.png',
    ]) {
      expect(() => buildMetadata({ ...input, image }, config)).toThrow();
    }
    expect(() =>
      buildMetadata(
        { ...input, route: { ...route, canonicalPath: '//evil.example/' } },
        config,
      ),
    ).toThrow();
    expect(() =>
      buildMetadata(input, { ...config, url: 'javascript:alert(1)' }),
    ).toThrow();
  });
  it('uses Article data for posts and validates explicit page schema types', () => {
    const entry = publication('posts', 'en', 'welcome', '2026-10-08');
    const article = JSON.parse(
      buildMetadata(
        { ...input, route: { ...route, kind: 'post', entry } },
        { ...config, author: 'Example author' },
      ).jsonLd!,
    );
    expect(article).toMatchObject({
      '@type': 'Article',
      headline: 'About',
      datePublished: '2026-10-08T00:00:00.000Z',
      author: { '@type': 'Person', name: 'Example author' },
    });
    for (const type of ['Person', 'Organization', 'LocalBusiness']) {
      expect(
        JSON.parse(
          buildMetadata(
            { ...input, structuredData: { type, name: 'A & B' } },
            config,
          ).jsonLd!,
        ),
      ).toMatchObject({ '@type': type, name: 'A & B' });
    }
    expect(() =>
      buildMetadata(
        { ...input, structuredData: { type: 'Product', name: 'Unsafe' } },
        config,
      ),
    ).toThrow();
    expect(() =>
      buildMetadata(
        {
          ...input,
          structuredData: {
            type: 'Person',
            name: 'Unsafe',
            url: 'javascript:alert(1)',
          },
        },
        config,
      ),
    ).toThrow();
  });
});

describe('JSON-LD serialization', () => {
  it('escapes script delimiters and JS line separators while preserving JSON values', () => {
    const value = {
      name: '</script><script>alert(1)</script>',
      text: 'A & B\u2028line\u2029end',
    };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toMatch(/[<\u2028\u2029]/);
    expect(JSON.parse(serialized)).toEqual(value);
  });
  it('rejects values that cannot be serialized as valid JSON', () => {
    expect(() => serializeJsonLd(undefined)).toThrow();
    expect(() => serializeJsonLd(1n)).toThrow();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => serializeJsonLd(circular)).toThrow();
  });
});

describe('feed selection', () => {
  it.each([
    { blog: false, rss: true },
    { blog: true, rss: false },
  ])('requires both flags: %j', (flags) => {
    const disabled = withFeatures(flags);
    expect(feedEnabled(disabled)).toBe(false);
    expect(buildFeedItems([], disabled)).toEqual([]);
  });
  it('selects published default-locale posts and projects with stable date ties and no fallbacks', () => {
    const configured = {
      ...withFeatures({ i18n: true }),
      base: '/demo/',
      i18n: { defaultLocale: 'en', locales: ['en', 'ms'] },
    };
    const routes = buildRouteManifest(
      [
        publication('posts', 'en', 'older', '2026-10-07'),
        publication('posts', 'en', 'z-post', '2026-10-08'),
        publication('projects', 'en', 'a-project', '2026-10-08'),
        publication('posts', 'ms', 'z-post', '2026-10-08'),
        publication('posts', 'ms', 'only-ms', '2026-10-09'),
        publication('posts', 'en', 'draft', '2026-10-09', true),
      ],
      configured,
      () => {},
    );
    expect(
      buildFeedItems(routes, configured).map((item) => [
        item.title,
        item.link,
        item.pubDate.toISOString(),
      ]),
    ).toEqual([
      [
        'a-project',
        'https://example.com/demo/projects/a-project/',
        '2026-10-08T00:00:00.000Z',
      ],
      [
        'z-post',
        'https://example.com/demo/blog/z-post/',
        '2026-10-08T00:00:00.000Z',
      ],
      [
        'older',
        'https://example.com/demo/blog/older/',
        '2026-10-07T00:00:00.000Z',
      ],
    ]);
    expect(buildFeedItems(routes, configured)[0].description).toBe(
      'Plain & text',
    );
    expect(
      buildFeedItems(routes, {
        ...configured,
        features: { ...configured.features, projects: false },
      }).every((item) => !item.link.includes('/projects/')),
    ).toBe(true);
  });
});
