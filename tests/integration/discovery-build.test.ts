import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';
import type { SiteConfig } from '../../src/lib/config/schema.ts';
import { buildFixture, exists } from '../helpers/build.ts';

const fixtures: Awaited<ReturnType<typeof buildFixture>>[] = [];
afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});
async function build(options: Parameters<typeof buildFixture>[0] = {}) {
  // Inspect the private route between preparation and sitemap generation.
  // This probe exists only in copied fixtures, and writes no route data to dist.
  const original = await readFile(
    new URL('../../astro.config.mjs', import.meta.url),
    'utf8',
  );
  const instrumented = `import { readFile, writeFile } from 'node:fs/promises';\n${original.replace('export default defineConfig(', 'const buildConfig = defineConfig(')}
const probe = { name: 'test:private-discovery-probe', hooks: { 'astro:build:done': async ({ dir }) => {
  const records = JSON.parse(await readFile(new URL('__build/routes.json', dir), 'utf8'));
  const onlyRouteData = records.every(record => Object.keys(record).sort().join(',') === 'alternates,canonicalPath,fallback,path' && record.alternates.every(alternate => Object.keys(alternate).sort().join(',') === 'locale,path'));
  await writeFile(new URL('../.astro/discovery-probe.json', dir), JSON.stringify({ privateAvailable: true, onlyRouteData, count: records.length }));
} } };
buildConfig.integrations.splice(2, 0, probe);
export default buildConfig;
`;
  const fixture = await buildFixture({
    ...options,
    content: { ...options.content, 'astro.config.mjs': instrumented },
  });
  fixtures.push(fixture);
  expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
  const observation = JSON.parse(
    await readFile(
      join(fixture.outputDir, '../.astro/discovery-probe.json'),
      'utf8',
    ),
  );
  expect(observation).toMatchObject({
    privateAvailable: true,
    onlyRouteData: true,
  });
  expect(observation.count).toBeGreaterThan(0);
  return fixture.outputDir;
}
const read = (root: string, path: string) => readFile(join(root, path), 'utf8');
const xml = (source: string) => {
  const document = new JSDOM(source, { contentType: 'text/xml' }).window
    .document;
  expect(document.querySelector('parsererror')).toBeNull();
  return document;
};
const html = (source: string) => new JSDOM(source).window.document;
const page = (title: string, slug: string, extra = '') =>
  `---\ntitle: ${title}\ndescription: A fixture description.\nslug: ${slug}\ndraft: false\n${extra}---\nFixture body.\n`;
async function sitemapUrls(root: string, base: string) {
  const indexSource = await read(root, 'sitemap.xml');
  expect(indexSource).toBe(await read(root, 'sitemap-index.xml'));
  const index = xml(indexSource);
  const parts: Document[] = [];
  for (const location of index.querySelectorAll('sitemap > loc')) {
    const url = new URL(location.textContent!);
    expect(url.origin).toBe('https://fixture.example');
    expect(url.pathname.startsWith(base)).toBe(true);
    const path = url.pathname.slice(base.length);
    expect(await exists(root, path), path).toBe(true);
    parts.push(xml(await read(root, path)));
  }
  expect(parts.length).toBeGreaterThan(0);
  return {
    parts,
    urls: parts.flatMap((part) =>
      [...part.querySelectorAll('url > loc')].map((node) => node.textContent!),
    ),
  };
}

describe('static discovery output', () => {
  it.each(['/', '/demo/'])(
    'builds safe heads and valid discovery artifacts under %s',
    async (base) => {
      const root = await build({
        config: {
          url: 'https://fixture.example',
          name: 'Fixture Site',
          base,
          author: 'Fixture Author',
        },
        content: {
          'src/content/posts/en/draft.md':
            '---\ntitle: Hidden\ndescription: Hidden draft.\nslug: draft\ndraft: true\npublishedAt: "2026-10-09"\n---\nSecret body.',
          'src/content/pages/en/identity.md': page(
            'Identity',
            'identity',
            'structuredData:\n  type: Person\n  name: "A </script><script>alert(1)</script> & B"\n',
          ),
          'src/content/pages/en/demo.md': page('Mounted slug', 'demo'),
        },
      });
      const { urls } = await sitemapUrls(root, base);
      expect(urls).toContain(
        `https://fixture.example${base}projects/example-project/`,
      );
      expect(urls).toContain(`https://fixture.example${base}demo/`);
      expect(urls.join(' ')).not.toMatch(
        /draft|404|not-found|__build|rss\.xml|robots\.txt/,
      );
      expect(await exists(root, '__build')).toBe(false);
      const robots = await read(root, 'robots.txt');
      expect(robots).toContain(
        `Sitemap: https://fixture.example${base}sitemap.xml`,
      );
      const feed = xml(await read(root, 'rss.xml'));
      expect(feed.querySelector('channel > title')?.textContent).toBe(
        'Fixture Site',
      );
      const items = [...feed.querySelectorAll('item')];
      expect(items).toHaveLength(2);
      expect(
        items.map((item) => item.querySelector('link')?.textContent),
      ).toEqual([
        `https://fixture.example${base}projects/example-project/`,
        `https://fixture.example${base}blog/welcome/`,
      ]);
      expect(
        items.map((item) => item.querySelector('pubDate')?.textContent),
      ).toEqual([
        'Thu, 08 Oct 2026 00:00:00 GMT',
        'Thu, 08 Oct 2026 00:00:00 GMT',
      ]);
      expect(await read(root, 'rss.xml')).not.toContain('content:encoded');
      const document = html(await read(root, 'blog/welcome/index.html'));
      expect(document.title).toBe(
        'Welcome to the demonstration | Fixture Site',
      );
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(`https://fixture.example${base}blog/welcome/`);
      expect(
        document
          .querySelector('meta[property="og:site_name"]')
          ?.getAttribute('content'),
      ).toBe('Fixture Site');
      expect(
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute('content'),
      ).toBe(`https://fixture.example${base}og-default.png`);
      expect(
        document
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute('content'),
      ).toBe('summary_large_image');
      expect(
        document
          .querySelector('link[type="application/rss+xml"]')
          ?.getAttribute('href'),
      ).toBe(`https://fixture.example${base}rss.xml`);
      expect(
        JSON.parse(
          document.querySelector('script[type="application/ld+json"]')!
            .textContent!,
        ),
      ).toMatchObject({
        '@type': 'Article',
        author: { name: 'Fixture Author' },
      });
      const identity = html(await read(root, 'identity/index.html'));
      const identityJsonLd = [...identity.querySelectorAll('script')].find(
        (script) => script.textContent?.includes('"@type":"Person"'),
      );
      expect(identityJsonLd).toBeDefined();
      expect(JSON.parse(identityJsonLd!.textContent!)['name']).toBe(
        'A </script><script>alert(1)</script> & B',
      );
      const project = html(
        await read(root, 'projects/example-project/index.html'),
      );
      const coverUrl = new URL(
        project
          .querySelector('meta[property="og:image"]')!
          .getAttribute('content')!,
      );
      expect(coverUrl.pathname).toMatch(new RegExp(`^${base}_astro/`));
      expect(await exists(root, coverUrl.pathname.slice(base.length))).toBe(
        true,
      );
      expect(
        html(await read(root, '404.html'))
          .querySelector('meta[name="robots"]')
          ?.getAttribute('content'),
      ).toBe('noindex, follow');
    },
    120_000,
  );

  it('includes reciprocal real translations and source canonicals without fallback alternates or feed duplicates', async () => {
    const root = await build({
      config: {
        url: 'https://fixture.example',
        base: '/demo/',
        i18n: { defaultLocale: 'en', locales: ['en', 'ms'] },
        features: { i18n: true } as SiteConfig['features'],
      },
      content: {
        'src/i18n/ms.json': '{}',
        'src/content/pages/ms/contact.md': page('Hubungi', 'contact'),
        'src/content/posts/ms/welcome.md': page(
          'Selamat datang',
          'welcome',
          'publishedAt: "2026-10-08"\n',
        ),
      },
    });
    const { parts, urls } = await sitemapUrls(root, '/demo/');
    expect(urls).toContain('https://fixture.example/demo/ms/contact/');
    expect(urls).toContain('https://fixture.example/demo/ms/blog/welcome/');
    expect(urls).not.toContain('https://fixture.example/demo/ms/about/');
    for (const path of ['contact/index.html', 'ms/contact/index.html']) {
      const document = html(await read(root, path));
      expect(
        [...document.querySelectorAll('link[hreflang]')].map((link) => [
          link.getAttribute('hreflang'),
          link.getAttribute('href'),
        ]),
      ).toEqual([
        ['en', 'https://fixture.example/demo/contact/'],
        ['ms', 'https://fixture.example/demo/ms/contact/'],
      ]);
    }
    const fallback = html(await read(root, 'ms/about/index.html'));
    expect(
      fallback.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://fixture.example/demo/about/');
    expect(fallback.querySelectorAll('link[hreflang]')).toHaveLength(0);
    const contacts = parts
      .flatMap((part) => [...part.querySelectorAll('url')])
      .filter((entry) =>
        entry.querySelector('loc')?.textContent?.endsWith('/contact/'),
      );
    expect(contacts).toHaveLength(2);
    for (const entry of contacts)
      expect(
        [
          ...entry.getElementsByTagNameNS(
            'http://www.w3.org/1999/xhtml',
            'link',
          ),
        ].map((link) => link.getAttribute('href')),
      ).toEqual([
        'https://fixture.example/demo/contact/',
        'https://fixture.example/demo/ms/contact/',
      ]);
    expect(
      xml(await read(root, 'rss.xml')).querySelectorAll('item'),
    ).toHaveLength(2);
    expect(await exists(root, '__build')).toBe(false);
  }, 120_000);

  it.each([
    { blog: false, rss: true, projects: false },
    { blog: true, rss: false, projects: true },
    { blog: true, rss: true, projects: false },
  ])(
    'honors feature switches %j',
    async (features) => {
      const root = await build({
        config: {
          url: 'https://fixture.example',
          base: '/demo/',
          features: features as SiteConfig['features'],
        },
      });
      const { urls } = await sitemapUrls(root, '/demo/');
      expect(urls.some((url) => url.includes('/blog/'))).toBe(features.blog);
      expect(urls.some((url) => url.includes('/projects/'))).toBe(
        features.projects,
      );
      const enabled = features.blog && features.rss;
      expect(await exists(root, 'rss.xml')).toBe(enabled);
      const head = html(await read(root, 'index.html'));
      expect(
        Boolean(head.querySelector('link[type="application/rss+xml"]')),
      ).toBe(enabled);
      if (enabled)
        expect(
          xml(await read(root, 'rss.xml')).querySelectorAll('item'),
        ).toHaveLength(1);
      expect(await exists(root, '__build')).toBe(false);
    },
    120_000,
  );
});
