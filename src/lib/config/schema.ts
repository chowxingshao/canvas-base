import { z } from 'astro/zod';

const deployTargets = [
  'none',
  'netlify',
  'vercel',
  'cloudflare',
  'github-pages',
  'docker-registry',
] as const;

export type DeployTarget = (typeof deployTargets)[number];

function isPublicHttpUrl(value: string): boolean {
  if (!/^https?:\/\//.test(value) || /[\\\s]/.test(value)) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isOrigin(value: string): boolean {
  return /^https?:\/\/[^/?#\\\s]+\/?$/.test(value) && isPublicHttpUrl(value);
}

function isSafeBase(value: string): boolean {
  if (/[\\?#\s]/.test(value) || value.startsWith('//')) return false;
  return value.split('/').every((segment) => {
    try {
      const decoded = decodeURIComponent(segment);
      return decoded !== '.' && decoded !== '..' && !/[/\\]/.test(decoded);
    } catch {
      return false;
    }
  });
}

const locale = z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const httpUrl = z.string().refine(isPublicHttpUrl, 'Use a public HTTP(S) URL.');

const siteConfigSchema = z
  .strictObject({
    name: z.string().trim().min(1),
    shortName: z.string().trim().min(1),
    description: z.string().trim().min(1),
    url: z
      .string()
      .refine(isOrigin, 'Use an HTTP(S) origin without credentials or a path.'),
    base: z
      .string()
      .default('/')
      .refine(
        isSafeBase,
        'Use a path without dot segments or encoded separators.',
      )
      .transform((value) => {
        const path = value.replace(/^\/+|\/+$/g, '');
        return path ? '/' + path + '/' : '/';
      }),
    language: locale,
    author: z.string(),
    email: z.union([z.literal(''), z.email()]),
    formEndpoint: z.union([z.literal(''), httpUrl]),
    social: z.record(z.string().min(1), z.union([z.literal(''), httpUrl])),
    analyticsId: z.string(),
    defaultOgImage: z
      .string()
      .refine(
        (value) =>
          isPublicHttpUrl(value) ||
          (value.startsWith('/') && value !== '/' && isSafeBase(value)),
        'Use a root-relative image path or public HTTP(S) URL.',
      ),
    i18n: z.strictObject({
      defaultLocale: locale,
      locales: z.array(locale).min(1),
    }),
    features: z.strictObject({
      blog: z.boolean(),
      projects: z.boolean(),
      rss: z.boolean(),
      motion: z.boolean(),
      i18n: z.boolean(),
      deploy: z.enum(deployTargets),
    }),
  })
  .superRefine((config, context) => {
    const { defaultLocale, locales } = config.i18n;
    if (!locales.includes(defaultLocale)) {
      context.addIssue({
        code: 'custom',
        path: ['i18n', 'defaultLocale'],
        message: 'The default locale must be in locales.',
      });
    }
    if (
      new Set(locales.map((value) => value.toLowerCase())).size !==
      locales.length
    ) {
      context.addIssue({
        code: 'custom',
        path: ['i18n', 'locales'],
        message: 'Locale codes must be unique.',
      });
    }
    if (config.language !== defaultLocale) {
      context.addIssue({
        code: 'custom',
        path: ['language'],
        message: 'Language must match the default locale.',
      });
    }
  });

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export function parseSiteConfig(value: unknown): SiteConfig {
  return siteConfigSchema.parse(value);
}
