import { describe, expect, it, vi } from 'vitest';
import type { ContentEntry } from '../../src/lib/content/entries.ts';
import { buildRouteManifest } from '../../src/lib/routing/manifest.ts';
import { localePath, withBase } from '../../src/lib/routing/paths.ts';
import { withFeatures } from '../helpers/config.ts';

const config = {
  ...withFeatures({ i18n: true }),
  i18n: { defaultLocale: 'en', locales: ['en', 'ms'] },
};
const page = (locale: string, slug: string, draft = false): ContentEntry => ({
  id: `${locale}/${slug}`,
  collection: 'pages',
  body: 'Page content.',
  data: {
    title: `${locale} ${slug}`,
    description: 'Page description.',
    slug,
    draft,
  },
});
const publication = (
  collection: 'posts' | 'projects',
  locale: string,
  slug: string,
  draft = false,
): ContentEntry => ({
  id: `${locale}/${slug}`,
  collection,
  body: 'Publication content.',
  data: {
    title: `${locale} ${slug}`,
    description: 'Publication description.',
    slug,
    draft,
    publishedAt: new Date('2026-10-08T00:00:00Z'),
  },
});
const entries = [
  page('en', 'home'),
  page('ms', 'home'),
  page('en', 'contact'),
  page('ms', 'contact'),
  page('en', 'about'),
  page('ms', 'about', true),
  page('en', 'english-only'),
  page('en', 'hidden', true),
  page('en', 'not-found'),
  publication('posts', 'en', 'welcome'),
  publication('posts', 'ms', 'welcome'),
  publication('projects', 'en', 'example'),
];

describe('base-aware paths', () => {
  it.each([
    ['/about/', 'en', '/', '/about/'],
    ['/about/', 'ms', '/', '/ms/about/'],
    ['/about/', 'ms', '/demo/', '/demo/ms/about/'],
    ['//about///', 'ms', '/demo/', '/demo/ms/about/'],
    ['/demo/ms/about/', 'ms', '/demo/', '/demo/ms/about/'],
    ['/demo/about/', 'ms', '/demo/', '/demo/ms/about/'],
    ['/demo/ms/about/', 'en', '/demo/', '/demo/about/'],
    ['/', 'ms', '/demo/', '/demo/ms/'],
  ])('maps %s to locale %s under %s', (path, locale, base, expected) => {
    expect(localePath(path, locale, { ...config, base })).toBe(expected);
  });
  it('does not prefix assets twice or change their extension', () => {
    expect(withBase('/demo//image.png', { ...config, base: '/demo/' })).toBe(
      '/demo/image.png',
    );
    expect(withBase('/demography/', { ...config, base: '/demo/' })).toBe(
      '/demo/demography/',
    );
  });
  it('rejects unknown and disabled locales', () => {
    expect(() => localePath('/', 'de', config)).toThrow(/Unknown locale.*de/);
    expect(() =>
      localePath('/', 'ms', {
        ...config,
        features: { ...config.features, i18n: false },
      }),
    ).toThrow(/Unknown locale.*ms/);
  });
});

describe('route manifest', () => {
  it('maps home, pages, publications, and optional-rest indexes', () => {
    const routes = buildRouteManifest(entries, config, vi.fn());
    expect(routes.find((r) => r.path === '/')).toMatchObject({
      kind: 'page',
      slug: 'home',
      fallback: false,
    });
    expect(routes.find((r) => r.path === '/contact/')).toMatchObject({
      kind: 'page',
      slug: 'contact',
    });
    expect(routes.find((r) => r.path === '/ms/blog/welcome/')).toMatchObject({
      kind: 'post',
      contentLocale: 'ms',
    });
    expect(routes.find((r) => r.path === '/projects/example/')).toMatchObject({
      kind: 'project',
    });
    expect(routes.find((r) => r.path === '/blog/')).toMatchObject({
      kind: 'post-index',
      slug: '',
      fallback: false,
    });
    expect(routes.find((r) => r.path === '/ms/projects/')).toMatchObject({
      kind: 'project-index',
      slug: '',
      contentLocale: 'ms',
    });
  });
  it('uses the published default for missing and draft translations and warns once per pair', () => {
    const warn = vi.fn();
    const routes = buildRouteManifest(entries, config, warn);
    const fallback = routes.find((r) => r.path === '/ms/about/');
    expect(fallback).toMatchObject({
      locale: 'ms',
      contentLocale: 'en',
      fallback: true,
      canonicalPath: '/about/',
      entry: { id: 'en/about' },
    });
    expect(fallback?.alternates).toEqual([{ locale: 'en', path: '/about/' }]);
    expect(routes.find((r) => r.path === '/ms/english-only/')).toMatchObject({
      fallback: true,
      canonicalPath: '/english-only/',
    });
    expect(
      warn.mock.calls.filter(
        ([message]) =>
          message === 'Missing translation: pages/about (ms); using en.',
      ),
    ).toHaveLength(1);
    expect(
      routes.some((r) => r.slug === 'hidden' || r.slug === 'not-found'),
    ).toBe(false);
  });
  it('lists only actual published translations in every alternate set', () => {
    const routes = buildRouteManifest(entries, config, vi.fn());
    expect(routes.find((r) => r.path === '/contact/')?.alternates).toEqual([
      { locale: 'en', path: '/contact/' },
      { locale: 'ms', path: '/ms/contact/' },
    ]);
    expect(routes.find((r) => r.path === '/ms/contact/')?.canonicalPath).toBe(
      '/ms/contact/',
    );
  });
  it('applies feature flags and excludes nondefault entries in single-language mode', () => {
    const warn = vi.fn();
    const routes = buildRouteManifest(
      entries,
      {
        ...config,
        features: {
          ...config.features,
          i18n: false,
          blog: false,
          projects: false,
        },
      },
      warn,
    );
    expect(routes.some((r) => r.locale !== 'en' || r.kind !== 'page')).toBe(
      false,
    );
    expect(warn).not.toHaveBeenCalled();
  });
  it('permits empty publication collections with enabled index routes', () => {
    expect(buildRouteManifest([], config, vi.fn()).map((r) => r.path)).toEqual([
      '/blog/',
      '/ms/blog/',
      '/projects/',
      '/ms/projects/',
    ]);
  });
  it('does not fabricate a default route or fallback from a default draft', () => {
    const routes = buildRouteManifest(
      [
        page('en', 'draft-only', true),
        page('en', 'translated', true),
        page('ms', 'translated'),
      ],
      config,
      vi.fn(),
    );
    expect(routes.filter((r) => r.kind === 'page').map((r) => r.path)).toEqual([
      '/ms/translated/',
    ]);
  });
  it('normalizes base once for routes, canonicals, and alternates', () => {
    const routes = buildRouteManifest(
      entries,
      { ...config, base: '/demo/' },
      vi.fn(),
    );
    expect(routes.find((r) => r.path === '/demo/ms/about/')).toMatchObject({
      canonicalPath: '/demo/about/',
      alternates: [{ locale: 'en', path: '/demo/about/' }],
    });
  });
  it.each(['blog', 'projects', '__build', 'en', 'ms'])(
    'rejects reserved page slug %s with a useful collision message',
    (slug) => {
      expect(() =>
        buildRouteManifest([page('en', slug)], config, vi.fn()),
      ).toThrow(new RegExp(`Route collision.*${slug}`));
    },
  );
  it('rejects duplicate route identities', () => {
    expect(() =>
      buildRouteManifest(
        [page('en', 'about'), page('en', 'about')],
        config,
        vi.fn(),
      ),
    ).toThrow(/Route collision.*about/);
  });
  it('rejects content in an unconfigured locale', () => {
    expect(() =>
      buildRouteManifest([page('de', 'about')], config, vi.fn()),
    ).toThrow(/Unknown locale.*de/);
  });
});

it('preserves both query and fragment suffixes', () => {
  expect(
    withBase('/image.png?v=1#preview', { ...config, base: '/demo/' }),
  ).toBe('/demo/image.png?v=1#preview');
});
it('retains a page slug that equals the mount path', () => {
  const routes = buildRouteManifest(
    [page('en', 'demo')],
    { ...config, base: '/demo/' },
    vi.fn(),
  );
  expect(
    routes.find((route) => route.kind === 'page' && route.locale === 'en')
      ?.path,
  ).toBe('/demo/demo/');
});

it('keeps the base when it matches the requested locale prefix', () => {
  expect(localePath('/', 'ms', { ...config, base: '/ms/' })).toBe('/ms/ms/');
});
