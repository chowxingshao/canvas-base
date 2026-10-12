import { siteConfig } from '../../site.config.ts';
import {
  parseSiteConfig,
  type SiteConfig,
} from '../../src/lib/config/schema.ts';

export function withFeatures(
  flags: Partial<SiteConfig['features']>,
): SiteConfig {
  const fixture = structuredClone(siteConfig);
  return parseSiteConfig({
    ...fixture,
    features: { ...fixture.features, ...flags },
  });
}
