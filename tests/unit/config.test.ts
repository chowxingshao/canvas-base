import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { readBrief } from '../../src/lib/config/brief.ts';
import { parseSiteConfig } from '../../src/lib/config/schema.ts';
import { getSiteConfig } from '../../src/lib/config/site.ts';
import { withFeatures } from '../helpers/config.ts';

const temporaryRoots: string[] = [];

async function fixtureRoot() {
  const directory = await mkdtemp(join(tmpdir(), 'canvas-config-'));
  temporaryRoots.push(directory);
  return { directory, root: pathToFileURL(directory + '/') };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('public site configuration', () => {
  it('validates the default feature fixture and returns independent copies', () => {
    expect(withFeatures({}).features).toEqual({
      blog: true,
      projects: true,
      rss: true,
      motion: true,
      i18n: false,
      deploy: 'none',
    });
    const fixture = withFeatures({ motion: false });
    fixture.i18n.locales.push('ms');
    expect(withFeatures({}).i18n.locales).toEqual(['en']);
    expect(getSiteConfig().features.motion).toBe(true);
  });

  it('defaults base to root and normalizes project mounts', () => {
    const fixture = withFeatures({});
    expect(parseSiteConfig({ ...fixture, base: undefined }).base).toBe('/');
    expect(parseSiteConfig({ ...fixture, base: 'portfolio' }).base).toBe(
      '/portfolio/',
    );
    expect(parseSiteConfig({ ...fixture, base: '/portfolio/' }).base).toBe(
      '/portfolio/',
    );
  });

  it.each([
    'javascript:alert(1)',
    'ftp://example.com',
    'https://example.com/path',
    'https://user:secret@example.com',
    'https://example.com?preview=1',
    'https://example.com#section',
    'https://example.com/?',
    'https://example.com/#',
  ])('rejects an unsafe or non-origin site URL: %s', (url) => {
    expect(() => parseSiteConfig({ ...withFeatures({}), url })).toThrow();
  });

  it.each([
    '/../escape/',
    '/./nested/',
    '/%2e%2e/escape/',
    '/nested%2Fescape/',
    '/nested%5cescape/',
    '/nested\\escape/',
    '//example.com/',
    '/path?query/',
    '/path#hash/',
  ])('rejects an unsafe base path: %s', (base) => {
    expect(() => parseSiteConfig({ ...withFeatures({}), base })).toThrow();
  });

  it('requires a default locale present in the locale list', () => {
    expect(() =>
      parseSiteConfig({
        ...withFeatures({ i18n: true }),
        i18n: { defaultLocale: 'en', locales: ['ms'] },
      }),
    ).toThrow();
  });

  it.each([
    ['en', 'en'],
    ['en', '../ms'],
    ['en', 'ms/escape'],
    ['en', ''],
    ['en', 'EN'],
  ])('rejects duplicate or unsafe locale lists: %j', (...locales) => {
    expect(() =>
      parseSiteConfig({
        ...withFeatures({ i18n: true }),
        i18n: { defaultLocale: 'en', locales },
      }),
    ).toThrow();
  });

  it('requires language to match the default locale', () => {
    expect(() =>
      parseSiteConfig({ ...withFeatures({}), language: 'ms' }),
    ).toThrow();
  });

  it('accepts safe regional locales and enabled deployment targets', () => {
    expect(
      parseSiteConfig({
        ...withFeatures({ i18n: true, deploy: 'github-pages' }),
        i18n: { defaultLocale: 'en', locales: ['en', 'ms', 'zh-Hant'] },
      }).features.deploy,
    ).toBe('github-pages');
  });

  it.each(['javascript:alert(1)', 'ftp://example.com/form', '/contact'])(
    'rejects non-HTTP(S) form endpoints: %s',
    (formEndpoint) => {
      expect(() =>
        parseSiteConfig({ ...withFeatures({}), formEndpoint }),
      ).toThrow();
    },
  );

  it('preserves empty optional values and accepts a public form URL', () => {
    const fixture = withFeatures({});
    expect(fixture.formEndpoint).toBe('');
    expect(fixture.analyticsId).toBe('');
    expect(
      parseSiteConfig({
        ...fixture,
        formEndpoint: 'https://forms.example.com/submit',
      }).formEndpoint,
    ).toBe('https://forms.example.com/submit');
  });

  it('validates flags and every public field instead of silently dropping mistakes', () => {
    expect(() =>
      parseSiteConfig({ ...withFeatures({}), email: 'invalid' }),
    ).toThrow();
    expect(() =>
      parseSiteConfig({
        ...withFeatures({}),
        social: { github: 'javascript:alert(1)' },
      }),
    ).toThrow();
    expect(() =>
      parseSiteConfig({
        ...withFeatures({}),
        features: { ...withFeatures({}).features, deploy: 'unknown' },
      }),
    ).toThrow();
    expect(() =>
      parseSiteConfig({ ...withFeatures({}), privateSecret: 'secret' }),
    ).toThrow();
  });
});

describe('build-only brief reader', () => {
  it('returns null for an absent brief', async () => {
    const { root } = await fixtureRoot();
    expect(await readBrief(root)).toBeNull();
  });

  it('returns the complete Markdown without interpreting it', async () => {
    const { directory, root } = await fixtureRoot();
    await writeFile(
      join(directory, 'brief.md'),
      '# Client brief\n\nA simple site.\n',
    );
    expect(await readBrief(root)).toBe('# Client brief\n\nA simple site.\n');
  });

  it('keeps filesystem errors visible', async () => {
    const { directory, root } = await fixtureRoot();
    await mkdir(join(directory, 'brief.md'));
    await expect(readBrief(root)).rejects.toThrow();
  });
});
