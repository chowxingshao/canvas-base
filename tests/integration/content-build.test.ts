import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { SiteConfig } from '../../src/lib/config/schema.ts';
import { buildFixture } from '../helpers/build.ts';

const fixtures: Awaited<ReturnType<typeof buildFixture>>[] = [];
afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});
async function build(
  content: Record<string, string> = {},
  config?: Partial<SiteConfig>,
) {
  const fixture = await buildFixture({ content, config });
  fixtures.push(fixture);
  return fixture;
}
async function invalidFixture(name: string) {
  return readFile(
    new URL(`../fixtures/content/${name}.md`, import.meta.url),
    'utf8',
  );
}
const probe = `import { getCollection, render } from 'astro:content';
import { getPublishedEntries, getEntryLocale } from '../lib/content/entries.ts';
export async function GET() {
  const posts = await getPublishedEntries('posts');
  const pages = await getPublishedEntries('pages');
  const projects = await getPublishedEntries('projects');
  const welcome = (await getCollection('posts')).find((entry) => entry.data.slug === 'welcome');
  const project = projects.find((entry) => entry.data.slug === 'example-project');
  const rendered = await render(welcome);
  return Response.json({ posts: posts.map((entry) => ({ id: entry.id, slug: entry.data.slug, locale: getEntryLocale(entry), publishedAt: entry.data.publishedAt.toISOString() })), pages: pages.map((entry) => entry.data.slug), projects: projects.map((entry) => entry.data.slug), cover: project.data.cover, mdxRendered: typeof rendered.Content === 'function' });
}`;
const post = (slug: string, date: string, draft = false) =>
  `---\ntitle: Test entry\ndescription: Test description\nslug: ${slug}\ndraft: ${draft}\npublishedAt: '${date}'\n---\nTest content.\n`;

describe('real Astro content builds', () => {
  it('loads Markdown, renders MDX, resolves images, and sorts published entries using frontmatter identities', async () => {
    const fixture = await build(
      {
        'src/pages/content-test.json.ts': probe,
        'src/content/posts/en/file-a.md': post('zulu', '2026-10-09'),
        'src/content/posts/en/file-b.md': post('alpha', '2026-10-09'),
        'src/content/posts/ms/translated-file.md': post('alpha', '2026-10-09'),
        'src/content/posts/en/hidden.md': post('hidden', '2026-10-10', true),
        'src/content/pages/en/hidden.md': post(
          'hidden-page',
          '2026-10-10',
          true,
        ),
        'src/content/projects/en/hidden.md': post(
          'hidden-project',
          '2026-10-10',
          true,
        ),
      },
      { i18n: { defaultLocale: 'en', locales: ['en', 'ms'] } },
    );
    expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
    const output = JSON.parse(
      await readFile(join(fixture.outputDir, 'content-test.json'), 'utf8'),
    );
    expect(output.posts).toEqual([
      {
        id: 'en/alpha',
        slug: 'alpha',
        locale: 'en',
        publishedAt: '2026-10-09T00:00:00.000Z',
      },
      {
        id: 'ms/alpha',
        slug: 'alpha',
        locale: 'ms',
        publishedAt: '2026-10-09T00:00:00.000Z',
      },
      {
        id: 'en/zulu',
        slug: 'zulu',
        locale: 'en',
        publishedAt: '2026-10-09T00:00:00.000Z',
      },
      {
        id: 'en/welcome',
        slug: 'welcome',
        locale: 'en',
        publishedAt: '2026-10-08T00:00:00.000Z',
      },
    ]);
    expect(output.pages).toEqual(['about', 'contact', 'home']);
    expect(output.projects).toEqual(['example-project']);
    expect(output.cover).toMatchObject({
      width: 960,
      height: 600,
      format: 'svg',
    });
    expect(output.mdxRendered).toBe(true);
  }, 120_000);

  it.each([
    ['empty-description', 'description'],
    ['missing-description', 'description'],
    ['missing-draft', 'draft'],
    ['invalid-date', 'publishedAt'],
    ['missing-image', 'does-not-exist'],
    ['missing-alt', 'coverAlt'],
    ['empty-alt', 'coverAlt'],
    ['unsafe-slug', 'slug'],
  ])(
    'rejects %s through the real collection loader',
    async (name, diagnostic) => {
      const fixture = await build({
        'src/content/posts/en/invalid.md': await invalidFixture(name),
      });
      expect(fixture.exitCode, fixture.stdout + fixture.stderr).not.toBe(0);
      expect(fixture.stdout + fixture.stderr).toContain(diagnostic);
    },
    120_000,
  );

  it('rejects duplicate locale/slug keys even when files contain identical data', async () => {
    const duplicate = post('repeated', '2026-10-08');
    const fixture = await build({
      'src/content/posts/en/one.md': duplicate,
      'src/content/posts/en/two.mdx': duplicate,
    });
    expect(fixture.exitCode, fixture.stdout + fixture.stderr).not.toBe(0);
    expect(fixture.stdout + fixture.stderr).toContain('en/repeated');
  }, 120_000);

  it('deep-merges config overrides without modifying the working tree', async () => {
    const before = await readFile(
      new URL('../../site.config.ts', import.meta.url),
      'utf8',
    );
    const fixture = await buildFixture({
      config: {
        name: 'Fixture Site',
        base: '/fixture/',
        i18n: { defaultLocale: 'en', locales: ['en', 'ms'] },
        features: { blog: false } as SiteConfig['features'],
      },
    });
    fixtures.push(fixture);
    expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
    expect(
      await readFile(join(fixture.outputDir, 'index.html'), 'utf8'),
    ).toContain('Fixture Site');
    expect(
      await readFile(new URL('../../site.config.ts', import.meta.url), 'utf8'),
    ).toBe(before);
  }, 120_000);
});
