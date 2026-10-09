import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { SiteConfig } from '../../src/lib/config/schema.ts';
import { buildFixture, exists } from '../helpers/build.ts';

const fixtures: Awaited<ReturnType<typeof buildFixture>>[] = [];
afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
});
async function build(options: Parameters<typeof buildFixture>[0] = {}) {
  const fixture = await buildFixture(options);
  fixtures.push(fixture);
  expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
  return fixture.outputDir;
}
const html = (root: string, path: string) => readFile(join(root, path), 'utf8');

describe('demonstration page output', () => {
  it('renders every published route with one heading, semantic landmarks, and working navigation', async () => {
    const root = await build();
    for (const path of [
      'index.html',
      'about/index.html',
      'contact/index.html',
      'blog/index.html',
      'blog/welcome/index.html',
      'projects/index.html',
      'projects/example-project/index.html',
      '404.html',
    ]) {
      expect(await exists(root, path), path).toBe(true);
      const output = await html(root, path);
      expect(output.match(/<h1(?:\s|>)/g), path).toHaveLength(1);
      expect(output).toContain('<main id="main-content"');
      expect(output).toContain('href="#main-content"');
      expect(output).toContain('<header');
      expect(output).toContain('<footer');
      expect(output).not.toContain('language-switcher');
    }
    expect(await html(root, 'blog/welcome/index.html')).toContain(
      'This sample post demonstrates MDX authoring.',
    );
    const project = await html(root, 'projects/example-project/index.html');
    expect(project).toContain('<img');
    expect(project).toContain('alt="A blue rectangle and circle');
    expect(project).toContain('loading="lazy"');
    expect(await exists(root, 'not-found/index.html')).toBe(false);
  }, 120_000);

  it('suppresses disabled indexes, details, and links, and leaves localized paths absent by default', async () => {
    const root = await build({
      config: {
        features: { blog: false, projects: false } as SiteConfig['features'],
      },
    });
    for (const path of [
      'blog/index.html',
      'blog/welcome/index.html',
      'projects/index.html',
      'projects/example-project/index.html',
      'ms/about/index.html',
    ]) {
      expect(await exists(root, path), path).toBe(false);
    }
    const output = await html(root, 'index.html');
    expect(output).not.toContain('href="/blog/"');
    expect(output).not.toContain('href="/projects/"');
  }, 120_000);

  it('uses requested UI direction and source article language, with mounted fallback language links', async () => {
    const root = await build({
      config: {
        base: '/demo/',
        i18n: { defaultLocale: 'en', locales: ['en', 'ms', 'ar'] },
        features: { i18n: true } as SiteConfig['features'],
      },
      content: {
        'src/i18n/ms.json': '{"nav":{"home":"Utama"}}',
        'src/i18n/ar.json': '{"nav":{"home":"الرئيسية"}}',
      },
    });
    const malay = await html(root, 'ms/about/index.html');
    expect(malay).toMatch(/<html[^>]*lang="ms"[^>]*dir="ltr"/);
    expect(malay).toMatch(/<article[^>]*lang="en"[^>]*dir="ltr"/);
    expect(malay).toContain('sample-only content');
    expect(malay).toContain('Utama');
    expect(malay).toContain('href="/demo/about/"');
    expect(malay).toContain('href="/demo/ar/about/"');
    expect(malay).toContain('href="/demo/fonts/source-sans-3-latin.woff2"');
    const arabic = await html(root, 'ar/about/index.html');
    expect(arabic).toMatch(/<html[^>]*lang="ar"[^>]*dir="rtl"/);
    expect(arabic).toMatch(/<article[^>]*lang="en"[^>]*dir="ltr"/);
    for (const path of ['ar/blog/welcome/index.html', 'ar/blog/index.html']) {
      const output = await html(root, path);
      const sourceContent = output.match(
        path.includes('welcome')
          ? /<article\b[^>]*>/
          : /<li\b[^>]*lang="en"[^>]*>/,
      )?.[0];
      expect.soft(sourceContent, path).toMatch(/\blang="en"/);
      expect.soft(sourceContent, path).toMatch(/\bdir="ltr"/);
      const date = output.match(/<time\b([^>]*)>([^<]*)<\/time>/);
      expect.soft(date?.[1], path).toMatch(/\blang="ar"/);
      expect.soft(date?.[1], path).toMatch(/\bdir="rtl"/);
      expect
        .soft(date?.[2], path)
        .toContain(
          path.includes('welcome') ? 'أكتوبر' : '08\u200f/10\u200f/2026',
        );
    }
    expect(await exists(root, 'ms/blog/index.html')).toBe(true);
    expect(await exists(root, 'ar/projects/example-project/index.html')).toBe(
      true,
    );
  }, 120_000);
});
