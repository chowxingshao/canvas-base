import type { SiteConfig } from '../config/schema.ts';

export function enabledLocales(config: SiteConfig): string[] {
  return config.features.i18n
    ? config.i18n.locales
    : [config.i18n.defaultLocale];
}

function normalize(path: string): string {
  return '/' + path.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
}

function withoutBase(path: string, config: SiteConfig): string {
  const normalized = normalize(path);
  const base = normalize(config.base).replace(/\/$/, '');
  return base && (normalized === base || normalized.startsWith(base + '/'))
    ? normalized.slice(base.length) || '/'
    : normalized;
}

// Preserve file extensions and query/fragment suffixes for asset consumers.
export function withBase(path: string, config: SiteConfig): string {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex < 0 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? '' : path.slice(suffixIndex);
  const base = normalize(config.base).replace(/\/$/, '');
  return normalize(base + withoutBase(pathname, config)) + suffix;
}

export function localePath(
  path: string,
  locale: string,
  config: SiteConfig,
): string {
  const locales = enabledLocales(config);
  if (!locales.includes(locale)) throw new Error(`Unknown locale: ${locale}.`);
  const segments = withoutBase(path, config).split('/').filter(Boolean);
  if (locales.includes(segments[0])) segments.shift();
  if (locale !== config.i18n.defaultLocale) segments.unshift(locale);
  const base = normalize(config.base).replace(/\/$/, '');
  return base + '/' + (segments.length ? segments.join('/') + '/' : '');
}
