# Content authoring

The starter ships three build-time collections: `pages`, `posts`, and `projects`. Files are Markdown or MDX directly under `src/content/<collection>/<locale>/`. The default locale is `en`, even when multilingual routes are disabled. Collection loading follows [Astro content collections](https://docs.astro.build/en/guides/content-collections/).

## Frontmatter

Every entry requires a nonempty `title`, a nonempty SEO `description`, an explicit boolean `draft`, and a stable `slug`. A slug is one lowercase segment containing letters, numbers, and single separating hyphens, such as `about-us`. Keep the slug stable when renaming the source file.

```yaml
---
title: Example project
description: A concise description for search results and previews.
slug: example-project
draft: false
publishedAt: '2026-10-08'
cover: ../../../assets/example-project.svg
coverAlt: Describe the information conveyed by the illustration.
---
```

`publishedAt` is required for posts and projects. Use a quoted ISO calendar date (`'2026-10-08'`) or a timezone-qualified datetime (`'2026-10-08T12:30:00+08:00'` or `'2026-10-08T04:30:00Z'`). Date-only values represent midnight UTC. Seconds are optional in timezone-qualified datetimes. Invalid calendar dates, local datetimes without a timezone, and ambiguous formats fail validation. The validated value is a JavaScript `Date`.

Optional `cover` paths resolve relative to the content file through Astro's `image()` schema. Put source images in `src/assets/`; the example path above works from a file in `src/content/projects/en/`. A missing image fails the build. Every cover requires nonempty descriptive `coverAlt`. Omit both fields when no cover is needed. Do not point local covers at `public/` or supply an unvalidated string to rendering code.

The directory determines locale; do not add a frontmatter locale. Each collection entry's ID is `<locale>/<slug>`, such as `en/example-project`. Duplicate identities within a collection fail the build, including duplicates across Markdown and MDX files. The same slug may occur in different locales or collections. Nested paths under a locale are not supported; use the stable slug for routing.

## Published entries

Use `getPublishedEntries(collection)` from `src/lib/content/entries.ts` for public lists and route generation. It excludes drafts in all environments and sorts posts/projects newest first, then by slug, then by ID to resolve a same-slug translation tie. Pages sort by slug. The reserved page slug `not-found` is excluded from general pages; the 404 route can retrieve that entry directly with Astro's `getEntry('pages', '<locale>/not-found')`.

Use `getEntryLocale(entry)` to derive the source locale from the ID. `ContentEntry` is the generated Astro `CollectionEntry<'pages' | 'posts' | 'projects'>` union. Use `entry.data.slug` rather than an invented entry-level slug or locale property. Filtering does not delete draft source data; raw Astro queries still include it, so public consumers must use the publishing helper.

Future-dated entries are sorted normally; this starter does not schedule publishing. Set `draft: true` until an entry is ready.

## Optional page identity

Pages may provide `structuredData` for an explicitly selected identity. The exported `PageStructuredData` type uses `type` as its discriminator:

```yaml
structuredData:
  type: Person
  name: Example author
  url: https://example.com
  sameAs:
    - https://example.com/profile
  jobTitle: Designer
```

All variants require `name`; optional `url` and every `sameAs` entry must be HTTP(S) URLs without embedded credentials. `Person` additionally permits `jobTitle`; `Organization` has no additional fields; `LocalBusiness` permits plain-text `address` and `telephone`. Unknown variant fields are rejected. No logo field is provided. Choose LocalBusiness only when the project brief requests it. The demo does not claim an organization or business identity. The metadata layer validates this value again and translates `type` to JSON-LD `@type`. Page identities are opt-in; other pages emit WebPage data and posts emit Article data.

## Adding a collection

Only create a collection when the project needs it. For example, `services`, `team`, or `highlights` can extend `baseEntrySchema` with project-specific validated fields. Register it in `src/content.config.ts` using a locale-aware glob loader and an image-aware schema. Update `CollectionName` and publishing behavior, add real validation tests, and implement the corresponding routes and views. Do not add unused collections to the starter.

## Demonstration content

The shipped pages, welcome post, project description, and SVG are clearly marked samples. Replace them with approved project content before client publication. They describe no fictional client achievements or results. MDX is available for entries that need markup or imported components; standard Markdown is sufficient for prose.

## Build fixtures

Tests use `buildFixture` from `tests/helpers/build.ts`. It copies the project into a separate temporary directory, reuses installed dependencies, deep-merges `config` overrides (replacing arrays), writes the supplied project-relative `content` file overrides, and launches Astro through the running Node executable without a shell. It returns the exit code, stdout, stderr, output directory, and an async `dispose()` callback. Call `dispose()` after assertions. Paths must stay inside the fixture and cannot overwrite dependency or generated-cache directories. Tests may inject a temporary route to inspect real generated collection data; no test route is added to the starter's source.

## Metadata and feeds

`SeoHead.astro` derives the title, description, canonical, Open Graph image, Twitter card, and actual translation alternates from the route and public site config. Titles use `<page title> | <site name>`, retaining a title that already equals the site name or ends with that suffix. Posts emit Article JSON-LD with their ISO publication date and the configured author when present. Optional page identities use the validated variants above. JSON-LD escapes script delimiters and Unicode line separators before inline insertion; normal text and attributes use Astro escaping.

A cover is processed through Astro's image pipeline for an absolute social image URL. Without a cover, use `defaultOgImage` from configuration. Root-relative assets are mounted under `base`; manifest routes already include `base` and are never prefixed again. The 404 page emits `noindex, follow` and is absent from sitemaps.

Real translations have reciprocal hreflang links in HTML and sitemap entries. A missing translation renders its source content with a source canonical, emits no hreflang links, and is omitted from the sitemap. Drafts and disabled content sections do not enter discovery artifacts.

The source guidance asks for RSS from posts and projects while also connecting RSS to the blog switch. This starter resolves that ambiguity explicitly: a feed exists only when both `features.blog` and `features.rss` are true. It contains published posts and enabled projects in the default locale only; fallback and translated duplicates are excluded. Items sort by publication date descending, then frontmatter slug, then entry ID. Titles and descriptions are plain text; keep frontmatter descriptions free of markup. RSS does not render Markdown/MDX bodies, run imported components, or add full-content HTML. XML escaping is handled by [`@astrojs/rss`](https://docs.astro.build/en/recipes/rss/).

`robots.txt` advertises the absolute base-aware `sitemap.xml` URL. That file aliases the integration's index and references existing numbered sitemap parts. The `__build` path is reserved for internal build data and must never be used for public content or endpoint routes.

When extending collections, also extend the manifest union, rendering wrappers, navigation eligibility, metadata/feed/sitemap behavior, and fixture coverage. Decide how drafts and translation fallbacks apply before exposing a new collection. Run `pnpm verify:fresh` after reusable changes; its own normal integration test does not launch recursive acceptance.
