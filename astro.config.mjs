import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { createDiscoveryIntegrations } from './src/lib/build/discovery.ts';
import { getSiteConfig } from './src/lib/config/site.ts';

const site = getSiteConfig();

export default defineConfig({
  site: site.url,
  base: site.base,
  output: 'static',
  integrations: [mdx(), ...createDiscoveryIntegrations(site)],
  ...(site.features.i18n
    ? {
        i18n: {
          defaultLocale: site.i18n.defaultLocale,
          locales: site.i18n.locales,
          routing: { prefixDefaultLocale: false },
        },
      }
    : {}),
});
