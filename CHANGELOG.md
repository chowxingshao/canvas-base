# Changelog

All notable template changes are documented here using Keep a Changelog conventions.

## [Unreleased]

### Changed

- Consolidated agent guidance into a single `CLAUDE.md` and removed `AGENTS.md`; README and architecture references now point only to `CLAUDE.md`.

### Fixed

- Added `.gitattributes` to normalize line endings to LF, so Windows checkouts (`core.autocrlf=true`) no longer produce CRLF files that fail `pnpm lint` and `pnpm verify:fresh`.
- Vercel previews require an API-verified successful production push bootstrap, preventing a PR from becoming a new project's first production deployment.

- Project setup preserves unowned workflows and completes containment, ownership, directory-collision, and symbolic-link preflight before writes or removals, including dangling manifest links and Windows cross-drive paths.
- Netlify, Vercel, and Cloudflare templates implement opt-in same-repository PR previews from verified CI artifacts and update preview URL comments while skipping fork credentials and preserving production deployment gates.

### Added

- `UPDATING.md` documenting how a copy started from this template pulls later upstream changes via an `upstream` remote, with layer-aware conflict guidance; linked from README and getting-started.
- Fresh release-source acceptance with credential/cache exclusions, owned temporary copies, source checksum preservation, complete gate execution, and final quality/handoff documentation.

- Reusable CI with verified static artifact gating, repository issue/PR templates, maintainer ownership, dependency update groups, MIT licensing, and contribution/security/agent guidance.

- Runnable static Astro starter with exact dependencies, strict TypeScript, linting, formatting, and Vitest.
- Validated public site configuration, safe origins and base paths, optional locale settings, and a build-only Markdown brief reader.
- Minimal demo page and setup, architecture, and dependency decision documentation.
- Typed pages, posts, and projects with ISO-date and image validation, deterministic draft filtering, isolated content-build tests, and clearly marked demonstration content.
- Centralized published content routes, base-aware locale URLs, optional translation fallback, validated UI dictionaries, and script-aware text direction.
- Replaceable editorial demonstration pages, manifest-driven navigation and language switching, accessible static layouts, self-hosted licensed Source Sans 3, system light/dark tokens, and real HTML route-output tests.

- Safe config-derived metadata and JSON-LD, canonical translation discovery, base-aware sitemap and robots, gated plain-text RSS, and ordered cleanup of private build artifacts with real HTML/XML fixtures.
- Accessible contact form with public endpoint configuration, native POST and no-JavaScript validation, local error feedback, a hidden honeypot, and Astro navigation cleanup.
