import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { getSiteConfig } from './src/lib/config/site.ts';

const site = getSiteConfig();

export default defineConfig({
  site: site.url,
  base: site.base,
  output: 'static',
  integrations: [mdx()],
});
