import { siteConfig } from '../../../site.config.ts';
import { parseSiteConfig, type SiteConfig } from './schema.ts';

const validatedConfig = Object.freeze(parseSiteConfig(siteConfig));

export function getSiteConfig(): Readonly<SiteConfig> {
  return validatedConfig;
}
