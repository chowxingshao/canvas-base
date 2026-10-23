# Canvas Base

A reusable static website starter built with Astro, strict TypeScript, Markdown/MDX, and plain CSS. Use it for content-focused sites such as portfolios, blogs, company introductions, resumes, and landing pages.

This foundation includes validated public site configuration, replaceable demonstration pages, typed content and routing, SEO, accessible forms, scoped motion, Docker serving, opt-in deployment setup, a build-only brief reader, and quality tools. The demo identity and origin are deliberately marked in `site.config.ts`. Author, email, social links, analytics, and form endpoint are empty.

## Quick start

Use Node **24.21.0** (`.nvmrc`) and pnpm **12.8.1** (`packageManager`). With those installed:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Commands

| Command                  | Purpose                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev`               | Start the local Astro development server.                                        |
| `pnpm preview`           | Serve the existing production build locally.                                     |
| `pnpm check`             | Run Astro diagnostics and TypeScript checking across scripts, config, and tests. |
| `pnpm lint`              | Run ESLint and check formatting with Prettier.                                   |
| `pnpm format`            | Format maintained source and documentation.                                      |
| `pnpm test`              | Run the complete Vitest suite once.                                              |
| `pnpm build`             | Generate static HTML in `dist/`.                                                 |
| `pnpm configure:project` | Generate brief/locales and only the selected deployment workflow.                |
| `pnpm verify:container`  | Verify an already running local Docker stack.                                    |
| `pnpm verify:fresh`      | Run frozen install and all gates in a new release-source copy.                   |

Before finishing a change, run tests, lint, check, and build. `pnpm test tests/unit/config.test.ts` runs configuration tests only. Formatting excludes the immutable guidance snapshot and approved plan in `docs/superpowers/`.

## Configuration and layers

Edit `site.config.ts` for public identity and feature settings. Its validated reader rejects unsafe origins, mount paths, locale combinations, and form URLs. `url` is an HTTP(S) origin; `base` is an optional project mount that defaults to `/` and normalizes to leading/trailing slashes.

The default flags are `blog: true`, `projects: true`, `rss: true`, `motion: true`, `i18n: false`, and `deploy: 'none'`. Blog and project routes honor their switches. RSS exists only when both blog and RSS are enabled and includes published default-locale posts plus enabled projects. Motion is a browser-only enhancement; deployment workflows remain opt-in.

Infrastructure is the **fixed layer**: toolchain configuration, validation, build helpers, and template documentation. Visual presentation is the **variable layer**: pages, layouts, components, CSS, imagery, and motion choreography. Replace presentation for each client brief. UI copy belongs in content files such as `src/content/ui.json`.

`readBrief(root)` loads `brief.md` as Markdown text at build/tooling time, returns `null` only for an absent file, and propagates other filesystem errors. Never import it into browser code. All site configuration is public; put no secrets in it.

## Folder map

```text
site.config.ts          Public site identity and feature flags
astro.config.mjs        Static build, MDX, and discovery integrations
src/lib/config/         Public validation/reader and Node-only brief reader
src/content/ui.json     Replaceable UI copy
src/pages/             Thin static route wrappers and discovery endpoints
tests/                  Unit tests and fresh configuration fixtures
docs/                   Setup, architecture, and decisions
```

## Hosting

`pnpm build` produces `dist/` for any static host, including Netlify, Vercel, and Cloudflare Pages. Configure their build command as `pnpm build` and publish directory as `dist`. GitHub Pages project sites also need their project path in `base`. Set the real public origin before deployment. With `deploy: 'none'`, this starter generates no deployment workflow.

## Dependency matrix

Versions were resolved from the npm registry on 2026-10-08. Every direct dependency has a purpose:

| Dependency                 | Exact version | Reason                                                                                              |
| -------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `astro`                    | 7.3.7         | Build static HTML with typed Astro pages and content support.                                       |
| `@astrojs/mdx`             | 8.0.3         | Compile MDX through Astro's supported integration.                                                  |
| `@astrojs/sitemap`         | 3.7.4         | Generate canonical sitemap artifacts.                                                               |
| `@astrojs/rss`             | 4.0.19        | Generate static RSS feeds.                                                                          |
| `gsap`                     | 3.15.0        | Provide scoped animation and ScrollTrigger APIs.                                                    |
| `sharp`                    | 0.35.5        | Process content images through Astro's real build-time Image pipeline under pnpm.                   |
| `typescript`               | 6.0.3         | Type-check source with the newest stable release compatible with Astro check and TypeScript ESLint. |
| `@astrojs/check`           | 0.9.10        | Diagnose Astro templates and their TypeScript.                                                      |
| `@types/node`              | 24.19.1       | Type the Node 24 filesystem and tooling APIs.                                                       |
| `eslint`                   | 10.12.0       | Run static source checks.                                                                           |
| `@eslint/js`               | 10.0.1        | Provide ESLint's recommended JavaScript rules.                                                      |
| `typescript-eslint`        | 8.71.1        | Parse and lint TypeScript with supported ESLint rules.                                              |
| `eslint-plugin-astro`      | 3.2.1         | Parse and lint Astro templates.                                                                     |
| `eslint-plugin-jsx-a11y-x` | 0.2.0         | Provide Astro accessibility rules compatible with ESLint 10.                                        |
| `prettier`                 | 3.9.9         | Format source and documentation consistently.                                                       |
| `prettier-plugin-astro`    | 1.1.0         | Format Astro templates.                                                                             |
| `vitest`                   | 5.0.3         | Test application logic using Astro's Vite configuration.                                            |
| `jsdom`                    | 30.1.2        | Provide a DOM environment for motion and form behavior tests.                                       |
| `@types/jsdom`             | 30.0.0        | Type real HTML/XML fixture inspection using the installed jsdom API.                                |

React, a UI library, Tailwind, and backend adapters are absent. Zod is imported from the installed Astro version's supported `astro/zod` export. The pnpm lockfile freezes transitive resolutions. `pnpm-workspace.yaml` permits only esbuild's required install script, excludes the incompatible optional legacy JSX accessibility peer, and records the exact Astro release exception generated by pnpm's release-age policy.

See [getting started](docs/getting-started.md), [architecture](docs/architecture.md), and the [dependency decision](docs/decisions/0003-dependencies.md).

## Maintenance and governance

CI runs for pull requests, pushes to main, and reusable workflow calls. It installs frozen dependencies and runs lint, check, test, build, then Docker build without publishing. Only successful runs upload the verified `site-dist` artifact. The CI configuration is locally validated; no passing hosted GitHub run is claimed and no CI badge is displayed.

See [contributing](CONTRIBUTING.md) for Conventional Commits, fixed-layer SemVer, release and migration rules, branch protection setup, and the reviewed client-copy governance checklist. [CLAUDE.md](CLAUDE.md) shares the same architecture and workflow references. [Troubleshooting](docs/troubleshooting.md) covers local gates and generated setup conflicts. [UPDATING.md](UPDATING.md) explains how a copy started from this template pulls later upstream changes.

The template uses the [MIT license](LICENSE), copyright 2026 chowxingshao, as confirmed by the owner. Preserve the MIT notice in reused code and the Source Sans 3 [font license](public/fonts/OFL.txt) and all required third-party notices. Review licensing and governance explicitly when creating a client site. [Security reporting](SECURITY.md) has no confirmed private contact or response SLA; GitHub private reporting setup is documented but not claimed enabled. The [Contributor Covenant 2.1](CODE_OF_CONDUCT.md) retains its designated conduct-contact placeholder pending maintainer confirmation.

## Fresh-copy acceptance

Run `pnpm verify:fresh` before releasing a template change. It creates a temporary project in a path containing spaces, installs the frozen lockfile, then runs check, lint, test, and build without editing copied source. It checks SHA-256 snapshots after every command. Success removes only its owned temporary directory; failure prints and retains the destination. The normal test suite checks the copy boundary with a small fixture and never recursively invokes full acceptance.

The release source keeps template governance, tests, assets, and font/legal notices. It excludes Git metadata, dependencies, builds, generated manifests/caches, local credentials, temporary evidence, and `docs/superpowers/`. The unchanged guidance and implementation plan remain in this maintenance repository, outside published starter copies. Review [client ownership and governance](CONTRIBUTING.md#reviewed-checklist-for-client-copies) explicitly for each client.

Additional commands: `pnpm configure:project` generates the selected local setup; `pnpm verify:container` verifies an already running local Docker stack. See [quality evidence](docs/quality-report.md) for measured acceptance and publication prerequisites.

## Optional React islands

Add React only for a concrete interactive component requirement. Resolve a compatible `@astrojs/react`, `react`, `react-dom`, and their TypeScript types; use Astro's React setup command or add the integration in `astro.config.mjs`. Pin exact versions, commit the lockfile, and justify each dependency in this README and `docs/decisions/`. Keep content rendered by Astro and hydrate the island with `client:visible` or `client:idle`. Test no-JavaScript content and repeat all acceptance gates after adding it.
