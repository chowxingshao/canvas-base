import defaultUi from '../../content/ui.json';
import { getSiteConfig } from '../config/site.ts';
import { enabledLocales } from '../routing/paths.ts';

export type UiStrings = typeof defaultUi;
type Dictionary = { [key: string]: string | Dictionary };
const dictionaries = import.meta.glob<{ default: unknown }>(
  '../../i18n/*.json',
);
const cache = new Map<string, Promise<UiStrings>>();

export function resolveUiStrings(
  locale: string,
  overrides: unknown,
  warn: (message: string) => void,
): UiStrings {
  const missing: string[] = [];
  function merge(
    defaults: Dictionary,
    value: unknown,
    prefix: string,
  ): Dictionary {
    if (
      value !== undefined &&
      (value === null || typeof value !== 'object' || Array.isArray(value))
    )
      throw new Error(
        `Invalid UI dictionary (${locale}): ${prefix || 'root'} must be an object.`,
      );
    const translated = (value ?? {}) as Record<string, unknown>;
    for (const key of Object.keys(translated)) {
      if (!Object.hasOwn(defaults, key))
        throw new Error(
          `Invalid UI dictionary (${locale}): unknown key ${prefix + key}.`,
        );
    }
    return Object.fromEntries(
      Object.entries(defaults).map(([key, fallback]) => {
        const path = prefix + key;
        const override = translated[key];
        if (typeof fallback === 'object')
          return [key, merge(fallback, override, path + '.')];
        if (override === undefined) {
          missing.push(path);
          return [key, fallback];
        }
        if (typeof override !== 'string' || !override.trim())
          throw new Error(
            `Invalid UI dictionary (${locale}): ${path} must be a nonempty string.`,
          );
        return [key, override];
      }),
    );
  }
  const result = merge(defaultUi, overrides, '') as UiStrings;
  if (missing.length)
    warn(
      `Missing UI translations (${locale}): ${missing.join(', ')}; using default dictionary.`,
    );
  return result;
}

export async function getUi(locale: string): Promise<UiStrings> {
  const config = getSiteConfig();
  if (!enabledLocales(config).includes(locale))
    throw new Error(`Unknown locale: ${locale}.`);
  if (!cache.has(locale))
    cache.set(
      locale,
      (async () => {
        if (locale === config.i18n.defaultLocale)
          return structuredClone(defaultUi);
        const load = dictionaries[`../../i18n/${locale}.json`];
        return resolveUiStrings(
          locale,
          load ? (await load()).default : undefined,
          console.warn,
        );
      })(),
    );
  return cache.get(locale)!;
}

export function localeDirection(locale: string): 'ltr' | 'rtl' {
  const language = new Intl.Locale(locale) as Intl.Locale & {
    getTextInfo?: () => { direction: 'ltr' | 'rtl' };
    textInfo?: { direction: 'ltr' | 'rtl' };
  };
  try {
    const direction =
      language.getTextInfo?.().direction ?? language.textInfo?.direction;
    if (direction) return direction;
  } catch {
    /* Older implementations may expose an unsupported text-info API. */
  }
  const script = language.maximize().script;
  return script &&
    [
      'Adlm',
      'Arab',
      'Hebr',
      'Mand',
      'Mend',
      'Nkoo',
      'Rohg',
      'Samr',
      'Syrc',
      'Thaa',
    ].includes(script)
    ? 'rtl'
    : 'ltr';
}
