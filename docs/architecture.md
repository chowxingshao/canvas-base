# Architecture

Astro builds static HTML with `output: 'static'`. MDX and ordered discovery integrations are active. There is no backend adapter, database, authentication, or server API. Strict TypeScript applies through Astro's strict preset; `pnpm check` also runs `tsc --noEmit` across TypeScript files, including config, scripts, and tests.

## Public configuration

The root `site.config.ts` exports public identity and feature values. `src/lib/config/schema.ts` validates every field and exports `SiteConfig`, `DeployTarget`, and `parseSiteConfig(value)`. It normalizes the optional mount path and rejects unsafe origins, endpoints, locale lists, and inconsistent language settings. Unknown properties are rejected to catch configuration mistakes.

`src/lib/config/site.ts` validates the root export once and exposes it through `getSiteConfig(): Readonly<SiteConfig>`. Both `astro.config.mjs` and the static page consume this reader, so build settings and rendered identity share the same values. The returned root object is frozen; nested objects remain typed configuration values. Consumers should treat the whole object as read-only.

`src/lib/config/brief.ts` is a separate Node-only boundary. It reads Markdown from a repository-root directory URL and never enters a browser bundle. Pass a directory URL with a trailing slash. It returns `null` for ENOENT and propagates every other filesystem error. It neither parses a brief into configuration nor embeds private brief data into a page.

## Layer boundary

The fixed layer owns the toolchain, config validation, routing/content/SEO/motion helpers when added, build tooling, and template documentation. Changes here should solve infrastructure problems or upgrade supported dependencies.

The variable layer owns pages, layouts, components, styles, imagery, typography, and animation choreography. Replace it for each project. Keep UI copy in content files; the minimal page reads identity through the public config reader and instructional text from `src/content/ui.json`.

Vitest uses Astro's documented `getViteConfig()` helper so supported exports such as `astro/zod` resolve in the test environment. Configuration fixtures clone the root values before merging feature overrides, preventing accidental state sharing.

Sitemap and RSS generate static discovery artifacts; jsdom parses real built HTML/XML in typed integration tests. GSAP remains an intentional foundation for the motion task. No deployment workflows are generated while the deploy target is `none`.

## Metadata and discovery boundary

`src/lib/seo/metadata.ts` exports `SeoInput`, `SeoMetadata`, `buildMetadata`, and `absoluteRouteUrl`. Route paths, canonical paths, and alternate paths are already mounted. The helper validates public config, rejects unsafe image/route URLs, and revalidates explicit page identity schemas. `serializeJsonLd` produces valid JSON with `<`, U+2028, and U+2029 escaped. `SeoHead.astro` processes content cover images through `astro:assets`, emits the complete static head, and adds feed discovery only when the feed exists. BaseLayout forwards metadata inputs; PageView forwards the optional validated page identity. The 404 wrapper explicitly requests noindex.

`src/lib/seo/feed.ts` exports `feedEnabled`, `FeedItem`, and `buildFeedItems`. The prerendered RSS endpoint passes plain-text titles/descriptions and real Dates to the supported RSS generator; it never renders content bodies. Feed eligibility requires blog and RSS, and projects remain independently gated.

`createDiscoveryIntegrations(config)` returns preparation, [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/), and finalization in that order. Astro ignores underscore-prefixed directories in filesystem routing, so preparation injects `/__build/routes.json` from `src/pages/__build/routes.json.ts` only for the build command, explicitly prerendered. That endpoint queries `getRouteManifest()` in Astro's render context and serializes only `{ path, canonicalPath, fallback, alternates }`. It never emits content bodies or config. Node-only config modules must not import `astro:content` or the runtime manifest helper.

After pages render, preparation reads that private artifact into an integration-local canonical map. The sitemap filter accepts only actual non-fallback canonical manifest records; serialization supplies only actual canonical translation links. No automatic locale cross-product is configured. Drafts, disabled sections, 404, endpoints, and private paths therefore stay outside the sitemap.

`finalizeArtifacts(outputDir, config)` runs after sitemap generation, copies `sitemap-index.xml` to the advertised `sitemap.xml`, removes a disabled RSS placeholder, then deletes the exact private JSON file and its empty directory. Cleanup uses nonrecursive directory removal so unexpected data cannot be silently erased. Final static output has no `__build` artifact and is suitable for a future Docker stage that copies `dist/`. Docker configuration and nginx includes are introduced separately in Task 8.
