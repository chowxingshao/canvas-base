# Architecture

Astro builds static HTML with `output: 'static'`. MDX is the only active integration in this foundation. There is no backend adapter, database, authentication, or server API. Strict TypeScript applies through Astro's strict preset; `pnpm check` also runs `tsc --noEmit` across TypeScript files, including config, scripts, and tests.

## Public configuration

The root `site.config.ts` exports public identity and feature values. `src/lib/config/schema.ts` validates every field and exports `SiteConfig`, `DeployTarget`, and `parseSiteConfig(value)`. It normalizes the optional mount path and rejects unsafe origins, endpoints, locale lists, and inconsistent language settings. Unknown properties are rejected to catch configuration mistakes.

`src/lib/config/site.ts` validates the root export once and exposes it through `getSiteConfig(): Readonly<SiteConfig>`. Both `astro.config.mjs` and the static page consume this reader, so build settings and rendered identity share the same values. The returned root object is frozen; nested objects remain typed configuration values. Consumers should treat the whole object as read-only.

`src/lib/config/brief.ts` is a separate Node-only boundary. It reads Markdown from a repository-root directory URL and never enters a browser bundle. Pass a directory URL with a trailing slash. It returns `null` for ENOENT and propagates every other filesystem error. It neither parses a brief into configuration nor embeds private brief data into a page.

## Layer boundary

The fixed layer owns the toolchain, config validation, routing/content/SEO/motion helpers when added, build tooling, and template documentation. Changes here should solve infrastructure problems or upgrade supported dependencies.

The variable layer owns pages, layouts, components, styles, imagery, typography, and animation choreography. Replace it for each project. Keep UI copy in content files; the minimal page reads identity through the public config reader and instructional text from `src/content/ui.json`.

Vitest uses Astro's documented `getViteConfig()` helper so supported exports such as `astro/zod` resolve in the test environment. Configuration fixtures clone the root values before merging feature overrides, preventing accidental state sharing.

Inactive dependencies are intentional foundations for later tasks: sitemap and RSS for SEO, GSAP for motion, and jsdom for DOM behavior tests. No deployment workflows are generated while the deploy target is `none`.
