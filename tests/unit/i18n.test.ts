import { afterEach, describe, expect, it, vi } from 'vitest';
import defaultUi from '../../src/content/ui.json';
import {
  getUi,
  localeDirection,
  resolveUiStrings,
} from '../../src/lib/i18n/ui.ts';

afterEach(() => vi.restoreAllMocks());

describe('UI dictionaries', () => {
  it('returns the complete default dictionary', async () => {
    expect(await getUi('en')).toEqual(defaultUi);
  });
  it('rejects unknown or disabled UI locales', async () => {
    await expect(getUi('de')).rejects.toThrow(/Unknown locale.*de/);
    await expect(getUi('ms')).rejects.toThrow(/Unknown locale.*ms/);
  });
  it('merges overrides and warns once when keys are missing', () => {
    const warn = vi.fn();
    const ui = resolveUiStrings(
      'ms',
      { starter: { demoNotice: 'Nilai demo.' } },
      warn,
    );
    expect(ui.starter.demoNotice).toBe('Nilai demo.');
    expect(ui.starter.nextStep).toBe(defaultUi.starter.nextStep);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(
      /Missing UI translations.*ms.*starter.nextStep/,
    );
  });
  it('falls back to the complete default when the dictionary is absent', () => {
    const warn = vi.fn();
    expect(resolveUiStrings('ms', undefined, warn)).toEqual(defaultUi);
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it.each([
    { extra: 'Invalid' },
    { starter: { extra: 'Invalid' } },
    { starter: 'Wrong shape' },
    { starter: { demoNotice: 10 } },
    { starter: { demoNotice: '' } },
    null,
  ])('rejects extra keys and invalid dictionary values: %j', (overrides) => {
    expect(() => resolveUiStrings('ms', overrides, vi.fn())).toThrow(
      /Invalid UI dictionary.*ms/,
    );
  });
  it('accepts complete translations without a warning', () => {
    const warn = vi.fn();
    expect(resolveUiStrings('ms', defaultUi, warn)).toEqual(defaultUi);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('locale text direction', () => {
  it.each([
    ['en', 'ltr'],
    ['ms', 'ltr'],
    ['ar', 'rtl'],
    ['he', 'rtl'],
    ['az-Arab', 'rtl'],
    ['ar-Latn', 'ltr'],
  ])('uses Intl direction for %s', (locale, expected) => {
    expect(localeDirection(locale)).toBe(expected);
  });
  it('uses script-aware compatibility detection when Intl text info is unavailable', () => {
    vi.spyOn(Intl.Locale.prototype, 'getTextInfo').mockImplementation(() => {
      throw new Error('Unsupported');
    });
    expect(localeDirection('fa')).toBe('rtl');
    expect(localeDirection('en')).toBe('ltr');
    expect(localeDirection('az-Arab')).toBe('rtl');
    expect(localeDirection('ar-Latn')).toBe('ltr');
  });
  it('rejects invalid language tags', () => {
    expect(() => localeDirection('invalid_tag')).toThrow(RangeError);
  });
});

it('loads optional dictionary files and caches route and UI fallbacks in a real build', async () => {
  const { buildFixture } = await import('../helpers/build.ts');
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const fixture = await buildFixture({
    config: {
      base: '/demo/',
      i18n: { defaultLocale: 'en', locales: ['en', 'ms'] },
      features: {
        i18n: true,
      } as import('../../src/lib/config/schema.ts').SiteConfig['features'],
    },
    content: {
      'src/i18n/ms.json': JSON.stringify({
        starter: { demoNotice: 'Nilai demo.' },
      }),
      'src/pages/route-test.json.ts': `import { getRouteManifest } from '../lib/routing/manifest.ts';
import { getUi } from '../lib/i18n/ui.ts';
export async function GET() {
  const [first, second, ui, repeatedUi] = await Promise.all([getRouteManifest(), getRouteManifest(), getUi('ms'), getUi('ms')]);
  return Response.json({ sameManifest: first === second, sameUi: ui === repeatedUi, routes: first, ui });
}`,
    },
  });
  try {
    expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
    const output = JSON.parse(
      await readFile(join(fixture.outputDir, 'route-test.json'), 'utf8'),
    );
    expect(output.sameManifest).toBe(true);
    expect(output.sameUi).toBe(true);
    expect(
      output.routes.find(
        (route: { path: string }) => route.path === '/demo/ms/about/',
      ),
    ).toMatchObject({
      canonicalPath: '/demo/about/',
      fallback: true,
      contentLocale: 'en',
    });
    expect(output.ui.starter.demoNotice).toBe('Nilai demo.');
    expect(output.ui.starter.nextStep).toBe(defaultUi.starter.nextStep);
    const log = fixture.stdout + fixture.stderr;
    expect(
      log.match(/Missing translation: pages\/about \(ms\); using en\./g),
    ).toHaveLength(1);
    expect(log.match(/Missing UI translations \(ms\)/g)).toHaveLength(1);
  } finally {
    await fixture.dispose();
  }
}, 120_000);
