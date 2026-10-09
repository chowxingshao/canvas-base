import type { SiteConfig } from './src/lib/config/schema.ts';

// Demo identity only: replace these four values for each client project.
export const siteConfig = {
  name: 'Canvas Base',
  shortName: 'Canvas',
  description: 'A reusable static website starter.',
  url: 'https://example.com',
  base: '/',
  language: 'en',
  author: '',
  email: '',
  formEndpoint: '',
  social: {},
  analyticsId: '',
  defaultOgImage: '/og-default.png',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  features: {
    blog: true,
    projects: true,
    rss: true,
    motion: true,
    i18n: false,
    deploy: 'none',
  },
} satisfies SiteConfig;
