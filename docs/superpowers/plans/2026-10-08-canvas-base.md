# Canvas Base Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, content-first Astro starter whose infrastructure is stable and whose visual design is replaceable for every client project.

**Architecture:** Typed configuration and validated local content feed one route manifest, which is shared by pages, navigation, SEO, and feeds. Small Astro components form an explicitly disposable demonstration design; browser-only GSAP helpers provide animation without owning that design. Docker, CI, opt-in project configuration, and documentation make a fresh copy independently usable.

**Tech Stack:** Latest stable Astro and compatible MDX, sitemap, and RSS integrations; strict TypeScript; plain CSS; GSAP/ScrollTrigger; pnpm; Vitest; ESLint/Prettier; Node LTS; nginx; GitHub Actions. Add React only when a project actually needs an island.

**Spec:** [Preserved source guidance](../specs/2026-10-08-canvas-base-guidance.md), copied unchanged from `C:/Users/user/Downloads/canvas-base-guidance.md`.

## Global Constraints

These are requirements extracted from the attached document for this proposed implementation, not additional instructions authorizing execution now.

- "This repo is a **reusable starter**, not a finished website."
- "Static output by default. `output: 'static'`."
- "No database. No authentication. No server-side API routes. No environment secrets in the client bundle."
- "**Do not add Tailwind by default.**"
- "Use `client:visible` or `client:idle`, never `client:load` by default."
- "Copy never lives inside a component."
- "Every item needs a `title`, a `description` (used for SEO), and a `draft` boolean."
- "Dates use ISO format."
- "Content must be visible without JavaScript."
- "Every animation respects reduced motion."
- "Mobile first. Test at 360px, 768px, and 1280px before calling anything done."
- "Lighthouse: 95+ performance, 100 accessibility, 100 best practices, 100 SEO, on desktop and mobile"
- "Fonts: self-host, use `font-display: swap`, subset where possible"
- "Multi-language support is off by default and enabled per project."
- "When it is `none`, do not generate deploy workflows."
- "Every change should leave `pnpm check`, `pnpm lint`, and `pnpm build` passing."
- "Add tests where logic exists: content schema validation, the i18n route helper, the motion enable check, and the SEO metadata builder. Use Vitest. Do not test visual output."
- "Do not add new dependencies without a reason stated in the README."
- "Each new dependency needs a one-line justification in `docs/decisions/`."
- "A template change is not done until a fresh project generated from it passes `pnpm check`, `pnpm lint`, and `pnpm build` without edits."

## Review Focus

Each risk has a specific test in its owning task; these cover behavior the prose specification leaves implicit.

1. A draft, an empty collection, or a disabled feature must not leave public detail pages, navigation, feed entries, or sitemap entries behind — Tasks 2, 3, 5.
2. A missing or draft translation must never expose draft text or pretend fallback text is translated; the build must report the fallback — Task 3.
3. Repeated navigation, live reduced-motion changes, and images that fail to load must not leave hidden text, stale pins, or duplicate listeners — Task 7.
4. Base-path hosting and hostile metadata text must produce correct local URLs and safe JSON-LD, without escaped-path or script-injection mistakes — Tasks 1, 5, 8.
5. Re-running setup, changing a deploy target, or copying the starter into a directory with spaces must preserve authored files and leave no stale generated deployment behavior — Tasks 9, 11.

---

## Starting state and scope

Inspected on 2026-10-08, Asia/Kuala_Lumpur: the workspace initially contained no files and was not a Git repository. No application, package manifest, tests, existing architecture, or applicable `AGENTS.md` was found. Node, pnpm, Docker, Git, and ripgrep executables are present; their versions and Docker daemon readiness have not been tested. This planning pass creates documentation only, plus the Git setup requested separately by the user.

The user supplied [chowxingshao/canvas-base](https://github.com/chowxingshao/canvas-base). Git is now initialized on an unborn `main` branch, with `origin` set to `https://github.com/chowxingshao/canvas-base.git`. After the user updated GitHub access, both `git ls-remote --symref origin HEAD` and `git ls-remote --refs origin` succeeded and returned no refs: the remote currently has no branches or tags. No commit, fetch, or push has been performed. Recheck remote history before the first implementation commit in case another contributor has initialized it. The URL identifies the repository account, not a confirmed legal copyright holder or security contact.

The attachment describes both building a template and using it later. This plan builds the template. Client intake, choosing among design directions, content approval, client licensing, enabling languages, and selecting a host become the documented workflow for future copies. They are not actions to perform on a client site during this task.

Suggested delivery boundaries are **core starter** (Tasks 1–6), **motion** (Task 7), and **distribution** (Tasks 8–11). Each can be reviewed as a separate milestone. They remain in one plan because they share configuration, content, and generated output; completing only one milestone does not fulfill the whole source guidance.

## Proposed decisions resolving gaps in the guidance

1. **Minimal collections:** ship `pages`, `posts`, and `projects`. Document examples for `services`, `team`, and `highlights`; do not create unused collections.
2. **Feature semantics:** `blog: false` removes blog routes and links; `projects: false` does the same for projects. Emit RSS only when `features.blog && features.rss`; when emitted it contains published posts and enabled projects. This honors both the RSS switch and the explicit request to include projects in feeds.
3. **Locales:** keep default content under `src/content/<collection>/en/`, even in single-language mode. Store default UI copy in `src/content/ui.json`; create `src/i18n/<locale>.json` only when i18n is enabled. Locale route source wrappers can exist, but produce zero localized paths when disabled.
4. **Fallbacks:** generate a requested locale's missing page from published default content, log the pair once, set the document language to the requested UI locale and the article's `lang` to the source locale. Canonicalize a fallback to its source page and omit that fallback from hreflang and sitemaps. Real translations across every enabled locale remain included.
5. **URLs:** add optional `base: '/'` to the illustrated configuration for GitHub Pages project sites. Treat `url` as an HTTP(S) origin with no query, fragment, or embedded credentials. Derive every internal URL, asset URL, feed URL, and nginx mount from `base`.
6. **Metadata:** derive default demo identity from configuration. A page may select `Person`, `Organization`, or `LocalBusiness` in validated content; only a brief explicitly requesting LocalBusiness should use it. Posts produce Article metadata. The template demo otherwise uses WebPage metadata.
7. **Demo:** propose a modest light/dark editorial specimen: warm neutral surfaces, a single blue link accent, self-hosted Source Sans 3, readable single-column text, simple project/post lists, and subtle entrance motion. Record this as a replaceable demonstration in `design-direction.md`. It is not a permanent template identity or a client design selection.
8. **Brief processing:** load Markdown as text; do not build an unreliable natural-language-to-config parser. One documented agent prompt reads the brief, proposes directions, and edits typed config after intake. Deterministic scripts handle mechanical setup only.
9. **Deployment:** store inactive workflow templates outside `.github/workflows/`. A local setup command generates only the explicitly selected target. No cloud resources, remote repositories, secrets, preview comments, or deployments are created by implementing this plan.
10. **Licensing and ownership:** the document proposes MIT but explicitly asks for owner confirmation. Before writing the template LICENSE, confirm MIT and the copyright holder. Obtain the maintainer's GitHub handle, private security contact, and response commitment before replacing clearly marked repository placeholders. These do not block technical tasks, but block claiming publication readiness. Client code licensing and required third-party attribution are separate; never remove legally required upstream notices.
11. **Dependency versions:** resolve current stable versions at implementation, save exact versions and the pnpm lockfile, and record the resolved matrix. Use the active Node LTS release supported by Astro; Node 24 is the planning baseline. Do not freeze an unverified Astro major into this document.
12. **Endpoints:** RSS and robots are prerendered build artifacts, not server API routes. Sitemap integration output receives a static `sitemap.xml` alias to satisfy the guidance's advertised URL.

## Implementation references

Consult the docs matching the version actually installed. These official sources were checked during planning:

- Astro requires supported Node versions and supports manual setup: [installation](https://docs.astro.build/en/install-and-setup/). The release schedule identifies Node 24 as Active LTS at the planning date: [Node releases](https://github.com/nodejs/Release).
- Use build-time loaders and image-aware collection schemas: [content collections](https://docs.astro.build/en/guides/content-collections/). Current documentation exports Zod from `astro/zod`; use the installed version's supported import.
- Configure built-in i18n with the default locale unprefixed: [i18n routing](https://docs.astro.build/en/guides/internationalization/). Content fallback selection in this plan happens at build time.
- The integration normally emits `sitemap-index.xml` plus numbered parts: [sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/). Feeds use the supported [RSS integration](https://docs.astro.build/en/recipes/rss/).
- Media-query animation setup can be reverted when preferences change: [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/).

## File responsibilities

All paths below are repository-relative. All application files are new; later tasks modify only files introduced by earlier tasks. Route wrappers remain thin; rendering belongs to the replaceable components.

| Area | Files and responsibility | Layer |
| --- | --- | --- |
| Toolchain | `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.editorconfig`, `.nvmrc`, `.gitignore`, `.dockerignore`, `vitest.config.ts` | Fixed |
| Site config | `site.config.ts`; `src/lib/config/{schema,site,brief}.ts`: validate and expose public values; load brief on Node only | Fixed |
| Content | `src/content.config.ts`; `src/lib/content/{schemas,entries}.ts`; Markdown/MDX in `src/content/{pages,posts,projects}/en/` | Schema/helpers fixed; copy variable |
| Routes/locales | `src/lib/routing/{types,manifest,paths}.ts`; `src/lib/i18n/ui.ts`; `src/content/ui.json`; optional `src/i18n/*.json` | Helpers fixed; copy variable |
| Pages | `src/pages/index.astro`, `[slug].astro`, `blog/{[...index],[slug]}.astro`, `projects/{[...index],[slug]}.astro`, `404.astro`; matching wrappers under `src/pages/[locale]/` except 404 | Variable |
| Presentation | `src/layouts/BaseLayout.astro`; `src/components/{PageView,EntryList,SiteHeader,SiteFooter,LanguageSwitcher,ContactForm}.astro`; `src/styles/{tokens,global}.css`; `src/assets/`; `public/` | Variable |
| SEO | `src/lib/seo/{metadata,json-ld,feed}.ts`; `src/components/SeoHead.astro`; `src/pages/{rss.xml,robots.txt}.ts`; build-only `src/pages/__build/routes.json.ts`; `src/lib/build/{discovery,artifacts}.ts` | Helpers/endpoints fixed; head presentation variable |
| Motion | `src/lib/motion/{index,environment,register,reveal,scroll-scene,context,refresh}.ts`; `src/scripts/page-motion.ts` | Helpers fixed; choreography variable |
| Form behavior | `src/lib/forms/validation.ts`; `src/scripts/contact-form.ts` | Replaceable component support |
| Distribution | `Dockerfile`, `docker-compose.yml`, `nginx.conf`; `scripts/{configure-project,configure-project-lib,verify-fresh}.ts`; `templates/deploy/` | Fixed |
| Quality | `tests/unit/`, `tests/integration/`, `tests/helpers/`, `tests/fixtures/`; `.github/` | Fixed |
| Workflow/docs | Root brief files, `design-direction.md`, `CLAUDE.md`, `AGENTS.md`, README, governance, and focused `docs/` listed in Tasks 1–11 | Template guidance fixed; client brief/direction variable |

## Shared execution conventions

- Do not execute this plan until it has been reviewed and the user has selected an execution approach.
- At execution start, inspect local Git status and the configured origin. Reuse the initialized repository; do not reinitialize it. Recheck its default branch/history before committing. If commits have appeared, fetch and reconcile the existing project with these untracked planning files before scaffolding; preserve both and never force-push. Apply the worktree skill if isolation is needed; a worktree requires a valid starting commit.
- All commands run from the repository root unless stated otherwise. Use cross-platform Node scripts, not shell-specific copying or deletion. In this Windows workspace, validate absolute temporary targets before cleanup.
- Each task's red test run must fail because of missing behavior, not a missing test runner. Bootstrap the test harness in Task 1 before the first red run. Do not write unit tests for static prose, styling choices, or configuration that merely mirror the implementation.
- `pnpm test` means `vitest run`. Tasks run their focused tests first; before each task commit run `pnpm lint`, `pnpm check`, and `pnpm build`. Add each task's user-visible change to `CHANGELOG.md` and update the doc named in that task.
- Commit steps refer to the task's listed files plus its docs/changelog, never unrelated files. Use one explicit staged file list per task. No push, release tag, or PR is included.

### Task 1: Runnable starter and validated configuration

**Files:** Create toolchain files from the map; `site.config.ts`; `src/lib/config/{schema,site,brief}.ts`; minimal `src/pages/index.astro`; `src/content/ui.json`; `tests/unit/config.test.ts`; `tests/helpers/config.ts`; `README.md`; `CHANGELOG.md`; `docs/{getting-started,architecture}.md`; `docs/decisions/{0001-use-astro,0002-plain-css-over-tailwind,0003-dependencies}.md`.

**Interfaces:**
- Export `DeployTarget = 'none' | 'netlify' | 'vercel' | 'cloudflare' | 'github-pages' | 'docker-registry'` and inferred `SiteConfig` from `schema.ts`.
- `parseSiteConfig(value: unknown): SiteConfig` validates all fields from guidance section 6, plus optional `base` defaulting to `/`. `getSiteConfig(): Readonly<SiteConfig>` returns the validated root export.
- `readBrief(root: URL): Promise<string | null>` reads `brief.md`, returning null only when absent; filesystem errors remain errors. This module is never imported by browser code.
- `withFeatures(flags: Partial<SiteConfig['features']>): SiteConfig` in `tests/helpers/config.ts` returns a fresh fixture merged with the defaults.

- [ ] **Step 1: Bootstrap the testable package.** Resolve stable package versions with `pnpm view <package> version` and compatible peer requirements; write exact dependency versions and `packageManager`, set `.nvmrc` to the resolved Node LTS patch, then install. Include Astro, MDX, sitemap, RSS, GSAP, TypeScript, Astro check, ESLint with Astro/TypeScript support, Prettier with Astro support, Vitest, and jsdom for motion/form behavior tests. Record a one-line reason for every dependency in the README and ADR. React and a UI library are absent. Provide `dev`, `preview`, `check`, `lint`, `format`, `test`, and `build` scripts; check includes `astro check` and `tsc --noEmit` for scripts/config/tests. Use Vitest's supported Astro-compatible configuration so schema imports resolve.
- [ ] **Step 2: Write configuration behavior tests.** Include valid default flags, invalid origin/base/locale combinations, and absent briefs. Assert these contracts:

```ts
expect(withFeatures({}).features).toEqual({ blog: true, projects: true, rss: true, motion: true, i18n: false, deploy: 'none' });
expect(() => parseSiteConfig({ ...withFeatures({}), url: 'javascript:alert(1)' })).toThrow();
expect(() => parseSiteConfig({ ...withFeatures({}), base: '/../escape/' })).toThrow();
expect(() => parseSiteConfig({ ...withFeatures({ i18n: true }), i18n: { defaultLocale: 'en', locales: ['ms'] } })).toThrow();
expect(await readBrief(emptyFixtureDirectory)).toBeNull();
```

- [ ] **Step 3: Run** `pnpm test tests/unit/config.test.ts`; expect missing config exports/behavior to fail.
- [ ] **Step 4: Implement the configuration and minimal page.** Preserve the guidance's flags and empty optional endpoint/analytics values. Use `name: 'Canvas Base'`, `shortName: 'Canvas'`, `description: 'A reusable static website starter.'`, and `https://example.com` as explicitly labeled demo values. Keep author/email/social values empty. Reject duplicate/unsafe locale codes, mismatched `language` and default locale, non-HTTP(S) endpoints, and origins containing paths, credentials, queries, or fragments. Normalize base to leading/trailing slashes; reject dot segments and encoded separators. `astro.config.mjs` consumes the same config, uses strict/static output and MDX, and does not import private data or a backend adapter.
- [ ] **Step 5: Run** `pnpm test tests/unit/config.test.ts`, `pnpm lint`, `pnpm check`, `pnpm build`; expect zero errors and `dist/index.html`. Document all seven commands and the layer boundary.
- [ ] **Step 6: Commit** the listed files with `feat: initialize typed Astro starter`.

### Task 2: Validated content and publish filtering

**Files:** Create `src/content.config.ts`, `src/lib/content/{schemas,entries}.ts`, `src/content/pages/en/{home,about,contact,not-found}.md`, `src/content/posts/en/welcome.mdx`, `src/content/projects/en/example-project.md`, `src/assets/example-project.svg`, `tests/unit/content.test.ts`, `tests/integration/content-build.test.ts`, `tests/helpers/build.ts`, `tests/fixtures/content/`, `docs/content.md`.

**Interfaces:**
- `CollectionName = 'pages' | 'posts' | 'projects'`; `ContentEntry = CollectionEntry<CollectionName>` uses Astro-generated types.
- Each schema requires nonempty `title`, `description`, explicit `draft`, and a stable one-segment `slug`. Slugs match `[a-z0-9]+(?:-[a-z0-9]+)*`; `locale` is derived from the directory. Posts/projects require `publishedAt`, accepting valid ISO date or timezone-qualified datetime strings and returning `Date`. Optional cover uses Astro's schema `image()` with required descriptive `coverAlt` when a cover exists.
- Export the common data schema as `baseEntrySchema`; `publicationDateSchema` handles dates. `getPublishedEntries(collection: CollectionName): Promise<ContentEntry[]>` excludes drafts and deterministically sorts newest first, breaking date ties by slug.
- `buildFixture(options: { config?: Partial<SiteConfig>; content?: Record<string, string> }): Promise<{ exitCode: number; stdout: string; stderr: string; outputDir: string; dispose(): Promise<void> }>` builds a separate temporary copy, deep-merging config overrides. It does not mutate the working project. Use this integration helper in later tasks.

- [ ] **Step 1: Write schema and build tests.** Pin invalid dates, draft filtering, missing SEO fields, and broken image references:

```ts
expect(baseEntrySchema.safeParse({ title: 'About', description: 'About us', slug: 'about' }).success).toBe(false); // explicit draft required
expect(publicationDateSchema.safeParse('2026-02-30').success).toBe(false);
expect(publicationDateSchema.safeParse('08/10/2026').success).toBe(false);
expect(publicationDateSchema.parse('2026-10-08').toISOString()).toBe('2026-10-08T00:00:00.000Z');
// In separate build fixtures: a missing cover file and an empty description each produce exitCode !== 0.
```

- [ ] **Step 2: Run** `pnpm test tests/unit/content.test.ts tests/integration/content-build.test.ts`; expect the schema or content validations to fail.
- [ ] **Step 3: Implement schemas, loaders, and fixtures.** Use build-time `glob` loaders for `**/*.{md,mdx}` under the three collection directories. Validate dates as actual calendar dates, not permissive rollover parsing. Keep optional business/person structured-data fields in page frontmatter with a discriminated type. Fail on duplicate locale/slug keys. Use clearly marked demonstration copy, not fictional client achievements. Keep `not-found` out of general page routes. Image tests use Astro's real image validation; do not replace it with a mock.
- [ ] **Step 4: Run** the focused tests and standard gates; expect valid Markdown and MDX to build, invalid fixtures to fail, and no authoring edits required for the base project. Document adding a collection, image paths, drafts, ISO dates, and sample-only content.
- [ ] **Step 5: Commit** with `feat: add typed content collections`.

### Task 3: One route manifest with optional locale fallback

**Files:** Create `src/lib/routing/{types,manifest,paths}.ts`, `src/lib/i18n/ui.ts`, `tests/unit/{routes,i18n}.test.ts`, `docs/i18n.md`; modify `astro.config.mjs` and `src/content/ui.json`.

**Interfaces:**
- `RouteRecord = { kind: 'page' | 'post' | 'project' | 'post-index' | 'project-index'; slug: string; path: string; locale: string; contentLocale: string; fallback: boolean; entry?: ContentEntry; canonicalPath: string; alternates: Array<{ locale: string; path: string }> }`.
- `buildRouteManifest(entries: ContentEntry[], config: SiteConfig, warn: (message: string) => void): RouteRecord[]` is pure except explicit warning output. `getRouteManifest(): Promise<RouteRecord[]>` loads and caches it per build process.
- `withBase(path: string, config: SiteConfig): string`; `localePath(path: string, locale: string, config: SiteConfig): string`; paths are base-aware and slash-normalized.
- `getUi(locale: string): Promise<UiStrings>` resolves the complete default JSON dictionary plus validated locale overrides. `UiStrings` is inferred from that default dictionary. `localeDirection(locale: string): 'ltr' | 'rtl'` uses Intl locale text direction, with a tested compatibility fallback.

- [ ] **Step 1: Write route and translation tests.** Provide complete ContentEntry fixtures in the test file, including published English, published Malay, draft Malay, and an English-only page:

```ts
expect(localePath('/about/', 'en', configWithEnMs)).toBe('/about/');
expect(localePath('/about/', 'ms', configWithEnMs)).toBe('/ms/about/');
expect(localePath('/about/', 'ms', { ...configWithEnMs, base: '/demo/' })).toBe('/demo/ms/about/');
expect(buildRouteManifest(entries, withFeatures({ i18n: false, blog: false }), warn).some(r => r.locale !== 'en' || r.kind === 'post' || r.kind === 'post-index')).toBe(false);
expect(malayFallback).toMatchObject({ locale: 'ms', contentLocale: 'en', fallback: true, canonicalPath: '/about/' });
expect(malayFallback.alternates.some(a => a.locale === 'ms')).toBe(false);
expect(warn).toHaveBeenCalledWith('Missing translation: pages/about (ms); using en.');
expect(localeDirection('ar')).toBe('rtl');
```

Also assert draft translations use published default content; default drafts produce no fallback; unknown locales throw; empty post/project lists are legal; reserved page slugs (`blog`, `projects`, enabled locale codes) fail with a useful collision message.

- [ ] **Step 2: Run** `pnpm test tests/unit/routes.test.ts tests/unit/i18n.test.ts`; expect missing route and UI behavior to fail.
- [ ] **Step 3: Implement the manifest and UI lookup.** Map home to `/`, general pages to `/<slug>/`, entries to `/blog/<slug>/` and `/projects/<slug>/`, and enabled indexes to their parent paths. Build paths for each enabled locale; deduplicate fallback warnings. Every route's alternates describe only actual published translations. Omit `not-found` and drafts entirely. Configure Astro i18n only when enabled, using `prefixDefaultLocale: false`; route generation supplies fallback pages, avoiding server middleware or duplicate automatic fallbacks. Missing UI keys fall back with a warning; extra keys fail validation. Use Intl for dates/numbers/currencies in consumers.
- [ ] **Step 4: Run** focused tests and standard gates. Verify single-language mode has no `src/i18n` files or locale output. Document fallback semantics, language tags, RTL logical CSS, font coverage, and how to enable dictionaries through Task 9's command.
- [ ] **Step 5: Commit** with `feat: centralize content routes and locale fallback`.

### Task 4: Replaceable demonstration pages

**Files:** Create `design-direction.md`, `src/layouts/BaseLayout.astro`, `src/components/{PageView,EntryList,SiteHeader,SiteFooter,LanguageSwitcher}.astro`, `src/styles/{tokens,global}.css`, `public/fonts/source-sans-3-latin.woff2`, its upstream license at `public/fonts/OFL.txt`, `public/og-default.png`, `public/favicon.svg`, `tests/integration/pages-build.test.ts`, `docs/design-directions.md`. Create all page wrappers listed in the file map and modify `src/pages/index.astro`, `src/content/ui.json`, and `src/content/pages/en/*.md`.

**Interfaces:**
- `BaseLayout` takes `{ title: string; description: string; locale: string; contentLocale?: string; route?: RouteRecord }` and the default slot. Task 5 adds the SEO model without changing route ownership.
- `PageView` takes `{ route: RouteRecord }`; it renders the collection entry with Astro's current `render(entry)` API or an index via `EntryList`.
- `EntryList` takes `{ entries: RouteRecord[]; locale: string; emptyLabel: string }`; `LanguageSwitcher` takes `{ current: RouteRecord; locales: string[] }`. Links use manifest paths, including fallback targets when available.
- Route wrappers call `getRouteManifest()`, filter by kind/locale, and pass the matching record to PageView. They must not independently reimplement draft or locale logic.
- Blog/project index wrappers use optional-rest `[...index].astro` with `params: { index: undefined }` when enabled and no paths when disabled. A static `index.astro` cannot suppress its output with `getStaticPaths`; do not use it for those feature-gated indexes. Localized index wrappers also include the explicit locale parameter.

- [ ] **Step 1: Write route-output integration tests.** Use `buildFixture` and read built HTML, testing behavior rather than styling:

```ts
expect(await exists(outputDir, 'index.html')).toBe(true);
expect(await exists(outputDir, 'blog/welcome/index.html')).toBe(true);
expect(await exists(outputDir, 'projects/example-project/index.html')).toBe(true);
expect(await exists(outputDir, '404.html')).toBe(true);
expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1);
expect(await exists(disabledOutputDir, 'blog/index.html')).toBe(false);
expect(await exists(singleLanguageOutputDir, 'ms/about/index.html')).toBe(false);
```

Define the small `exists(root: string, relative: string): Promise<boolean>` test helper in `tests/helpers/build.ts`. Include an i18n build fixture asserting Malay fallback HTML contains the English article with `lang="en"`, and Arabic output uses `dir="rtl"`.

- [ ] **Step 2: Run** `pnpm test tests/integration/pages-build.test.ts`; expect missing routes/markup to fail.
- [ ] **Step 3: Record the demonstration direction.** Describe its palette, font, spacing, layout, contrast, focus treatment, and light/dark tokens. Set motion character to `power2.out`, 0.35–0.6 seconds, short vertical section entrances, no default pinning, no cursor effects. Document that each client replaces this direction after choosing among two or three brief-driven alternatives. Source the font from its official distribution and retain attribution; if a configured language is outside its coverage, require a matching self-hosted script font as part of that client's direction.
- [ ] **Step 4: Implement the page components and wrappers.** Build home/about/contact, blog/project indexes and details, and a useful 404 with one h1. Keep all copy in content/UI data and identity in config. Put every design value in tokens; use logical CSS properties, visible focus, a skip link, semantic landmarks, descriptive alt text, Astro Image for content images, and lazy loading below the fold. Keep navigation simple enough to work without a hamburger or React. Only show a language switcher when multiple locales are enabled. Header/footer links respect flags. Do not ship translation JSON in the default tree; fixture dictionaries exist only under tests. No CSS hides content waiting for motion.
- [ ] **Step 5: Run** focused tests and standard gates; manually inspect 360px, 768px, and 1280px, keyboard navigation, light/dark preference, JavaScript disabled, long headings, and 40% longer UI strings. There are no pixel snapshot tests. Record any performance or accessibility gap in `docs/quality-report.md` for Task 11.
- [ ] **Step 6: Commit** with `feat: add replaceable content-driven demo pages`.

### Task 5: Consistent metadata, sitemap, robots, and RSS

**Files:** Create `src/lib/seo/{metadata,json-ld,feed}.ts`, `src/components/SeoHead.astro`, `src/pages/{rss.xml,robots.txt}.ts`, `src/pages/__build/routes.json.ts`, `src/lib/build/{discovery,artifacts}.ts`, `tests/unit/seo.test.ts`, `tests/integration/discovery-build.test.ts`; modify `src/layouts/BaseLayout.astro`, `astro.config.mjs`, `docs/{content,architecture}.md`.

**Interfaces:**
- `SeoInput = { title: string; description: string; route: RouteRecord; image?: string; structuredData?: Record<string, unknown> }`.
- `buildMetadata(input: SeoInput, config: SiteConfig): SeoMetadata`, with `SeoMetadata = { title: string; description: string; canonical: string; image: string; locale: string; alternates: Array<{ locale: string; url: string }>; jsonLd?: string }`.
- `serializeJsonLd(value: unknown): string` serializes valid JSON and escapes `<`, U+2028, and U+2029 for an inline script element.
- `feedEnabled(config: SiteConfig): boolean`; `buildFeedItems(routes: RouteRecord[], config: SiteConfig): Array<{ title: string; description: string; link: string; pubDate: Date }>` returns default-locale published post/project items in descending date order, with stable ties and no fallback duplicates.
- `finalizeArtifacts(outputDir: URL, config: SiteConfig): Promise<void>` runs in the Astro build-done hook: creates `sitemap.xml` from the integration index and removes the disabled feed artifact. Task 8 extends it to prepare nginx includes. A disabled RSS endpoint may return a harmless placeholder during generation; no `rss.xml` may remain in final output.
- `createDiscoveryIntegrations(config: SiteConfig): AstroIntegration[]` in `discovery.ts` returns ordered preparation, sitemap, and finalization integrations. A private prerendered `__build/routes.json` artifact serializes only `{ path, canonicalPath, fallback, alternates }` from `getRouteManifest()`. Preparation reads it after pages render, before the sitemap integration runs; callbacks use that in-memory data. Finalization removes it and its empty directory. This keeps `astro:content` imports in Astro's render context, never in `astro.config.mjs` or its Node-only modules.

- [ ] **Step 1: Write metadata and discovery tests.** Assert config identity, base-path handling, safe serialization, and artifact absence:

```ts
expect(buildMetadata(input, { ...config, base: '/demo/' }).canonical).toBe('https://example.com/demo/about/');
expect(serializeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('<');
expect(JSON.parse(serializeJsonLd({ name: 'A & B' })).name).toBe('A & B');
expect(feedEnabled(withFeatures({ blog: false, rss: true }))).toBe(false);
expect(feedEnabled(withFeatures({ blog: true, rss: false }))).toBe(false);
```

Build fixtures assert drafts and disabled sections are absent from all sitemap parts and RSS, projects appear when enabled, real translations have reciprocal hreflang, and fallback translations have only source canonicals. `robots.txt` must point to the absolute, base-aware `/sitemap.xml` URL; every referenced sitemap part must exist. Assert the private route artifact is absent from final output, sitemap entries, and the production Docker tree; reserve `__build` as an internal path.

- [ ] **Step 2: Run** `pnpm test tests/unit/seo.test.ts tests/integration/discovery-build.test.ts`; expect missing metadata/discovery behavior to fail.
- [ ] **Step 3: Implement SEO helpers and head output.** Titles are `<page title> | <site name>`, avoiding duplicate names. Escape normal attributes through Astro; only inject JSON-LD after safe serialization. Resolve absolute OG images from config or image metadata, emit Open Graph and Twitter tags, use Article data for posts and validated explicit page schema types for Person/Organization/LocalBusiness. Render 404 with noindex. Feed descriptions are plain text using `@astrojs/rss`; no raw MDX rendering pipeline is needed.
- [ ] **Step 4: Wire sitemap, robots, and build finalization.** Filter the sitemap against canonical manifest records, excluding 404/fallbacks/drafts/disabled paths. Configure each entry's alternate links from actual translations, rather than inventing all locale combinations. Generate robots statically. Include feed autodiscovery in the head only when enabled. Register build hooks in a small integration from `artifacts.ts`, not a shell postbuild copy command.
- [ ] **Step 5: Run** focused tests and standard gates. Inspect built head, XML validity, absolute URLs, RSS item dates, and all links under both `/` and `/demo/` fixtures. Document the source guidance's RSS ambiguity and this plan's chosen semantics.
- [ ] **Step 6: Commit** with `feat: generate safe metadata and discovery artifacts`.

### Task 6: Accessible third-party contact form

**Files:** Create `src/components/ContactForm.astro`, `src/lib/forms/validation.ts`, `src/scripts/contact-form.ts`, `tests/unit/forms.test.ts`; modify `src/components/PageView.astro`, `src/content/ui.json`, `src/content/pages/en/contact.md`, `docs/{getting-started,deployment}.md`.

**Interfaces:**
- `ContactValues = { name: string; email: string; message: string; website: string }`.
- `validateContact(values: ContactValues): { valid: boolean; errors: Partial<Record<'name' | 'email' | 'message', 'required' | 'invalid'>>; spam: boolean }` trims whitespace and checks a filled honeypot.
- `initContactForm(form: HTMLFormElement): () => void` installs local validation and returns listener cleanup; it never fetches, persists, or logs form values.
- `ContactForm` takes `{ endpoint: string; ui: UiStrings }`, supplied from config and UI data. The visible fields are name, email, message; the default honeypot is website. Provider-specific field naming is adjusted and documented when that provider is selected.

- [ ] **Step 1: Write behavior tests.** In jsdom test these cases and assert no network or browser storage calls:

```ts
expect(validateContact({ name: ' ', email: 'bad', message: '', website: '' })).toMatchObject({ valid: false, errors: { name: 'required', email: 'invalid', message: 'required' } });
expect(validateContact({ name: 'Ada', email: 'ada@example.com', message: 'Hello', website: 'spam' }).spam).toBe(true);
expect(validateContact({ name: 'Ada', email: 'ada@example.com', message: 'Hello', website: '' }).valid).toBe(true);
// Submitting an invalid form prevents default, sets aria-invalid, and focuses the first invalid field.
// Calling cleanup twice leaves no active validation listener.
```

- [ ] **Step 2: Run** `pnpm test tests/unit/forms.test.ts`; expect missing validation and lifecycle behavior to fail.
- [ ] **Step 3: Implement the form.** An empty endpoint renders a disabled fieldset, disabled submit control, no action URL, and the external UI message `Contact form is not configured yet.` A configured form uses native `method="post"`, labeled required inputs and browser validation, and optional script enhancement. Validation errors use UI strings and `aria-live`/`aria-describedby`. Put the honeypot outside keyboard navigation and accessibility exposure. Preserve native submission when valid. Wire initialization to the initial page and `astro:page-load`, and dispose on `astro:before-swap` without accumulating listeners. State in the docs that the provider must enforce server-side validation and its own honeypot rules; a generic endpoint does not guarantee spam protection.
- [ ] **Step 4: Run** focused tests and standard gates. Manually check configured and empty-endpoint forms using local submission interception only; verify keyboard/error announcements and no-JS native validation. Do not send a real message to a third-party endpoint. Document public endpoint configuration without secret keys.
- [ ] **Step 5: Commit** with `feat: add accessible endpoint-driven contact form`.

### Task 7: Scoped GSAP helpers and reliable cleanup

**Files:** Create `src/lib/motion/{index,environment,register,reveal,scroll-scene,context,refresh}.ts`, `src/scripts/page-motion.ts`, `tests/unit/{motion-environment,motion-lifecycle}.test.ts`, `docs/motion.md`; modify `src/components/PageView.astro`, `src/styles/tokens.css`, `design-direction.md`.

**Interfaces:**
- `registerMotion(): void` registers ScrollTrigger once, only in a browser and only when motion is allowed.
- `motionEnabled(): boolean` returns false without a browser, with the feature disabled, or with reduced motion enabled. `environment.ts` stays importable during SSR without importing GSAP.
- `RevealOptions = { direction?: 'up' | 'down' | 'left' | 'right' | 'none'; distance?: number; duration?: number; delay?: number; ease?: string; stagger?: number }`.
- `reveal(element: Element | Element[], options?: RevealOptions): gsap.core.Tween | null`; defaults are up, 24px, 0.5s, 0s delay, `power2.out`, and 0s stagger. Explicit options override validated `data-reveal-*` values, then defaults. Invalid/negative duration/delay/stagger values fall back to defaults.
- `scrollScene(element: Element, timeline: gsap.core.Timeline, options?: { start?: string; end?: string; scrub?: boolean | number; pin?: boolean; markers?: boolean }): ScrollTrigger | null`; defaults: `top bottom`, `bottom top`, false, false, false. The passed timeline is paused until the helper owns it; disabled motion moves it to its final state without a trigger.
- `motionContext(root: Element): gsap.Context`; `refreshOnLoad(root?: ParentNode): () => void`; `initPageMotion(root: Element): () => void`.
- Components add animations with `ctx.add(() => { ... })`, and teardown calls `ctx.revert()`. The page initializer owns its media-query context and refresh cleanup. No module-level animation or trigger creation.

- [ ] **Step 1: Write behavior tests with mocked GSAP boundaries.** Cover enabled/disabled/SSR paths, repeated initialization and teardown, image errors, and changing media preferences:

```ts
expect(motionEnabled()).toBe(false); // in the dedicated Node-environment SSR test
expect(reveal(element)).toBeNull(); // reduced-motion jsdom fixture
expect(element.style.opacity).not.toBe('0');
registerMotion(); registerMotion();
expect(gsap.registerPlugin).toHaveBeenCalledTimes(1); // enabled browser fixture
dispose(); dispose();
expect(activeTriggerCount()).toBe(0);
```

`activeTriggerCount()` is test-owned mock state. Include an enabled-to-reduced transition asserting every managed tween/trigger is reverted and final content is visible. A failed image `error` event must complete refresh waiting; a disposal before fonts resolve must prevent late refresh. A supplied paused timeline must finish when motion is disabled. Explicit options must win over dataset values.

- [ ] **Step 2: Run** `pnpm test tests/unit/motion-environment.test.ts tests/unit/motion-lifecycle.test.ts`; expect missing helpers/lifecycle behavior to fail.
- [ ] **Step 3: Implement the fixed helper API.** Keep registration idempotent and guard browser globals. `refreshOnLoad` observes existing loaded/failed images and waits for unsettled images plus fonts, with removable listeners and a disposed guard. Use GSAP media-query contexts to revert on preference changes. Refresh after subsequent layout changes through a batched observer attached by the page initializer; disconnect on disposal and avoid resize feedback loops.
- [ ] **Step 4: Add minimal page choreography.** Initialize from a page/component script, using one scoped context per page and a small number of section timelines. Use JS to set entrance states; animate transform/opacity only. Handle `astro:page-load` and `astro:before-swap` if view transitions are later enabled, plus ordinary initial load, without duplicate initialization. A failed import leaves content visible. Do not enable view transitions, pinning, horizontal scrolling, counters, or cursor effects by default. Document those as optional recipes, including cleanup, refresh, and reduced-motion handling.
- [ ] **Step 5: Run** focused tests and standard gates. Manually verify repeated navigation in a temporary view-transition fixture, preference changes while a section is animating, late-loading images/fonts, links/forms during animation, and a mid-range-phone performance profile. The runtime fixture must return to zero owned triggers on teardown. Record device/emulation details without claiming physical-device testing if unavailable.
- [ ] **Step 6: Commit** with `feat: add accessible scoped motion helpers`.

### Task 8: Production Docker serving and asset-compatible headers

**Files:** Create `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `tests/unit/headers.test.ts`, `scripts/verify-container.ts`; modify `src/lib/build/artifacts.ts`, `.dockerignore`, `package.json`, `docs/deployment.md`.

**Interfaces:**
- `buildSecurityHeaders(config: SiteConfig, inlineScriptHashes: string[], inlineStyleHashes: string[]): Record<string, string>` lives in `src/lib/build/artifacts.ts` initially; split into `src/lib/build/headers.ts` if the artifact module exceeds one clear responsibility.
- Extend `finalizeArtifacts` to emit `.generated/nginx/{headers,locations}.conf` outside the public output, hashing built inline scripts/styles with Node crypto. It also writes a base-aware nginx document tree under `.generated/nginx/html/`, with built assets mounted at the configured base. Ignore `.generated/` in Git and exclude it from copied source fixtures.
- `pnpm verify:container` runs `scripts/verify-container.ts`, inspecting an already running local container at `http://localhost:8080`; it never deploys remotely. Script returns nonzero on incorrect content, status, compression, caching, or headers.

- [ ] **Step 1: Write header tests and the container verification script.** Assert exact security behavior:

```ts
expect(headers['X-Content-Type-Options']).toBe('nosniff');
expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
expect(headers['Content-Security-Policy']).toContain("form-action 'none'"); // empty endpoint
expect(headers['Content-Security-Policy']).not.toContain("script-src 'unsafe-inline'");
// A configured https://forms.example/submit endpoint permits exactly https://forms.example in form-action.
```

The HTTP script requires `/` status 200, an unknown URL status 404 with the actual 404 page, HTML `Cache-Control: no-cache`, hashed `/_astro/` assets `public, max-age=31536000, immutable`, gzip when accepted, and security headers on both HTML and asset responses. Repeat with base `/demo/` in a separate fixture image.

- [ ] **Step 2: Run** `pnpm test tests/unit/headers.test.ts`; expect missing header behavior to fail. Run the HTTP script only after the image exists; do not count connection refusal as a useful red test.
- [ ] **Step 3: Implement build and serving.** Use the resolved `node:<lts>-alpine` build image, frozen pnpm install, and `nginx:alpine` runtime. Copy generated nginx HTML and includes into the runtime image; keep source and Node dependencies out. Compose exposes `8080:80`, builds locally, and needs no environment values. Set `try_files` for actual static pages and 404, never SPA fallback. Keep HTML revalidated and cache immutable hashed assets only. Repeat security-header includes in locations where nginx inheritance would otherwise drop them. Use gzip, `frame-ancestors 'none'`, constrained scripts/styles/fonts/images, and only the configured form origin. Allow GSAP's style attributes deliberately; hash inline script/style elements instead of blanket script exemptions. No HSTS for local HTTP.
- [ ] **Step 4: Run** focused tests, standard gates, `docker compose up --build -d`, and `pnpm verify:container`; expect the image to serve the build with all HTTP assertions passing. Manually inspect the browser console under nginx for CSP violations affecting motion, fonts, JSON-LD, or forms. Stop only the compose resources created for this check using `docker compose down`. Record a Docker-unavailable limitation if the daemon cannot run; do not claim it passed.
- [ ] **Step 5: Commit** with `feat: package static site with nginx and Docker`.

### Task 9: Repeatable brief and opt-in project configuration

**Files:** Create `brief.template.md`, `brief.md`, `scripts/{configure-project,configure-project-lib}.ts`, `templates/deploy/{netlify,vercel,cloudflare,github-pages,docker-registry}.yml.template`, `templates/deploy/README.md`, `scripts/prepare-vercel.ts`, `tests/unit/project-setup.test.ts`, `tests/integration/project-setup.test.ts`, `docs/brief.md`, `docs/decisions/0004-project-setup.md`; modify `package.json`, `docs/{i18n,deployment}.md`.

**Interfaces:**
- `configureProject(options: { root: string; config: SiteConfig; branch?: string }): Promise<{ created: string[]; updated: string[]; removed: string[] }>` from `configure-project-lib.ts`; the CLI loads current config and calls it through `pnpm configure:project`. `branch` defaults to `main` and can be supplied through `--branch`.
- The function creates `brief.md` from its template only when absent; initializes missing locale dictionaries from default UI strings only when i18n is enabled; and generates `.github/workflows/deploy.yml` only for the selected target. Initial locale dictionaries contain clearly documented English fallback copy, not fabricated translations.
- `.canvas/generated.json` records generated paths and SHA-256 hashes. Only unchanged script-owned files can be replaced or removed; a modified file creates an actionable conflict error before any writes. The manifest contains no content, credentials, or absolute machine paths.
- `prepareVercelArtifact(distDir: string, outputDir: string): Promise<void>` builds Vercel's static prebuilt directory structure from `dist/`; the target workflow uses it only for Vercel. Validate the current provider contract when implementing.

- [ ] **Step 1: Write setup tests in temporary directories.** Assert idempotence and collision safety:

```ts
await configureProject({ root, config });
expect((await configureProject({ root, config })).created).toEqual([]);
expect(await read(root, 'brief.md')).toBe(authoredBrief); // pre-existing brief retained
expect(await exists(root, '.github/workflows/deploy.yml')).toBe(false); // deploy none
expect(await exists(root, 'src/i18n/en.json')).toBe(false); // i18n false
// none -> netlify creates only deploy.yml; netlify -> none removes an unchanged generated workflow.
// Modifying that workflow before the second transition makes the entire operation fail without writes.
```

Also test i18n enable/disable with modified dictionaries, path traversal in the ownership manifest, no deletion outside root, locale changes, and a workspace named `Client Sites/Test One`. Test the Vercel adapter's output structure, not a real upload.

- [ ] **Step 2: Run** `pnpm test tests/unit/project-setup.test.ts tests/integration/project-setup.test.ts`; expect missing script behavior to fail.
- [ ] **Step 3: Implement mechanical setup and the brief workflow.** Copy the brief headings from guidance section 5 exactly. Do not infer a deploy target from free text or install React unless the project needs it. Use Node APIs with resolved containment checks for every path and reject symlink escapes; preflight the complete change set before writing. Disabling i18n removes only untouched script-owned dictionaries; authored files require the user to relocate them or keep the feature enabled. On conflict, leave the tree unchanged and explain the exact path. Provide one documented agent prompt that reads the brief/config, asks missing essentials together, proposes two or three directions, records the chosen direction, then implements the variable layer. Keep an example filled brief separately at `docs/examples/brief.md`.
- [ ] **Step 4: Author inactive deployment templates.** Do not place them in the active workflow directory. Generated deployment calls the reusable CI workflow from Task 10 and downloads that run's verified static artifact. Production requires a protected selected branch or protected release tag and GitHub environment controls; document that repository administrators must configure those protections. Validate the optional branch argument against Git ref rules. Docker registry deploys only version tags and pushes version plus latest after CI succeeds.

For Netlify/Cloudflare, deploy the verified `dist/` using pinned provider CLIs. For Vercel, prepare the static prebuilt artifact rather than running an unrelated source build. GitHub Pages uses the official upload/deploy actions and base-path config; GHCR uses the built image and minimal package permissions. Provide same-repository PR previews where supported, gated by successful checks and explicit preview enablement through a documented repository variable `ENABLE_PREVIEWS=true`. Skip fork previews needing credentials, never run untrusted PR code through `pull_request_target`, and post/update a preview comment only in the explicitly enabled generated workflow. Template implementation itself does not send comments.

Document exact secret/variable names: Netlify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`; Vercel `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; Cloudflare `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and project variable `CLOUDFLARE_PAGES_PROJECT_NAME`; Pages and GHCR use scoped `GITHUB_TOKEN`. Recheck provider/action versions and required arguments against official docs when implementing, and record the resolved versions. Never put example secret values into any file.

- [ ] **Step 5: Run** focused tests and standard gates. In isolated copies, generate each of the five target workflows and run a pinned actionlint version against them; verify disabled target output has none. Test setup twice, target switching, and i18n switching. Remote deploy success and preview posting remain unverified until a client selects a host and supplies its settings; explicitly label that limit in `docs/deployment.md`.
- [ ] **Step 6: Commit** with `feat: add repeatable project configuration and deploy templates`.

### Task 10: CI and repository standards

**Files:** Create `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.yml`, `.github/pull_request_template.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CLAUDE.md`, `AGENTS.md`, `LICENSE` after owner confirmation, `docs/troubleshooting.md`; update `README.md`, `CHANGELOG.md`, `docs/{architecture,deployment}.md`.

**Interfaces:**
- `ci.yml` runs on pull_request, push to main, and workflow_call. It exposes a build artifact named `site-dist` only after lint, check, test, build, and Docker build pass. Its default permissions are contents:read. Deployment workflows depend on its success, not on a separate unchecked checkout build.
- All agent-facing instructions point to the same architecture/workflow documentation. Distinguish template maintenance from creating a client site and do not paste the attached guidance wholesale into authoritative instruction files without adapting its contradictions.

- [ ] **Step 1: Write the CI workflow.** Pin official actions to currently supported major tags; record their versions at implementation. Set up the pinned pnpm and Node versions; cache the pnpm store with `actions/cache`, keyed by OS/Node/lockfile. Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and Docker build without push, in that order. Use concurrency cancellation for superseded PR runs. Ensure paths containing spaces work. Treat any failed stage as a failed job and do not upload a deployable artifact after failure.
- [ ] **Step 2: Add repository templates and maintenance rules.** Add issue forms and a PR checklist covering checks, docs, changelog, and visual evidence when relevant. Dependabot covers npm, Actions, and Docker with minor/patch grouping and separately reviewed majors. Document Conventional Commits, SemVer for fixed-layer API changes, releases on main, and migration notes. Explain branch protection setup; do not modify remote settings. CODEOWNERS uses the confirmed maintainer, or a clearly labeled nonfunctional placeholder until supplied.
- [ ] **Step 3: Write governance and authoring docs.** Use an official, identified Contributor Covenant version unchanged except designated contact substitutions, retain required attribution, and include the source URL. SECURITY states confirmed private reporting contact/response expectations and supported versions; don't promise an invented SLA. Write MIT LICENSE only after the owner confirms MIT and attribution. Before that, package metadata remains `UNLICENSED` and documentation labels license readiness unresolved. Preserve third-party font/tool notices regardless of the eventual client license. Document why template open-source governance files are removed/replaced in client copies, through an explicit reviewed checklist rather than an automatic destructive cleanup script.
- [ ] **Step 4: Verify** with actionlint on active CI and generated workflow fixtures, `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and Docker build. Static document edits need proofreading/link inspection, not unit tests. Check the README quick start uses at most three commands and badges are limited to verified CI/license status. Without a remote repo or credentials, report CI configuration as locally validated, not as a passing GitHub run.
- [ ] **Step 5: Commit** with `ci: validate template and document contribution workflow`.

### Task 11: Fresh-copy acceptance and complete handoff

**Files:** Create `scripts/verify-fresh.ts`, `tests/integration/fresh-copy.test.ts`, `docs/quality-report.md`; modify `package.json`, `.gitignore`, `README.md`, `CHANGELOG.md`, `docs/{getting-started,architecture,brief,design-directions,content,motion,i18n,deployment,troubleshooting}.md`.

**Interfaces:**
- `pnpm verify:fresh` runs the Node script with a newly created temporary destination and prints its final status. It copies the release source set, excluding `.git`, dependencies, build output, generated caches, local credentials, and temporary fixtures. It runs install/check/lint/test/build without modifying any copied source files; retain the failed destination for diagnosis and print its path.
- `tests/integration/fresh-copy.test.ts` validates copying/containment with a small fixture only. It must not invoke `pnpm verify:fresh` from the normal test suite, avoiding recursive tests. The full fresh check is a separate acceptance command.

- [ ] **Step 1: Write the copy-boundary test.** In a directory with spaces, ensure authored source is copied and `.env`, `.git`, node_modules, dist, `.astro`, `.generated`, and local `.canvas` manifests are excluded. Verify source checksums remain unchanged after the copy, unsafe destinations are rejected, and cleanup cannot traverse outside the owned temporary root.
- [ ] **Step 2: Run** `pnpm test tests/integration/fresh-copy.test.ts`; expect the missing copy/validation behavior to fail.
- [ ] **Step 3: Implement the acceptance script and finish documentation.** Use argument arrays for process spawning, never concatenated shell commands. Preserve the source snapshot and implementation plan in the working repository; state clearly which planning material is excluded from a published starter package. For a generated client copy, provide an explicit license/governance review checklist, while a fresh template copy keeps template governance. Include how to add React only when needed, extend collections, select script-covering fonts, use optional motion recipes, enable i18n, configure a form provider, and generate the selected deploy workflow.
- [ ] **Step 4: Run the release checks.** Run `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, `pnpm verify:fresh`, and Docker verification after the final source changes. Expected: all commands pass, fresh copied source needs no edits, and production HTTP behavior matches Task 8. Run fixture builds for defaults, all content features off, RSS alone off, motion off, en/ms with missing translation, Arabic RTL, and `/demo/` hosting; inspect artifacts for each. Clean up only owned test containers/directories.
- [ ] **Step 5: Record browser and Lighthouse evidence.** Inspect every demo page at 360/768/1280, keyboard-only, light/dark, reduced motion, no JS, and long translated strings. Run desktop and mobile Lighthouse against production serving, covering each page type and spot-checking every page. Target performance >=95 and accessibility/best-practices/SEO 100; record actual results, versions, URL, date, device/emulation, and any unmet targets with causes and follow-up work. Do not turn these into pixel tests or claim unperformed device/browser checks.
- [ ] **Step 6: Check publication prerequisites and commit** with `test: verify fresh template copies and document acceptance`. Confirm owner/license/security contacts or explicitly leave publication readiness open. Summarize implemented behavior, successful checks, environment limitations, and untested provider deployments. Do not publish or deploy as part of this task.

## Requirement coverage and self-review

| Guidance sections | Owning tasks |
| --- | --- |
| 1–3: purpose, stack, layer boundary | 1, 4, 7, 8 |
| 4–5, 15: intake, brief, per-client workflow | 4, 9, 10, 11 |
| 6: centralized configuration | 1, 3, 9 |
| 7: content, images, schemas, routes | 2, 3, 4, 5 |
| 8: motion API and lifecycle | 7 |
| 9–10: components, accessibility, performance | 4, 6, 7, 11 |
| 11: SEO, JSON-LD, sitemap, RSS | 5 |
| 12: forms | 6, 8 |
| 13–14: Docker, deployment, commands | 1, 8, 9 |
| 16: standards, docs, testing, fresh copies | 1–11, particularly 10–11 |
| 17: optional i18n, fallback, RTL | 3, 4, 5, 9, 11 |
| 18: CI and optional CD | 9, 10 |
| 19–20: exclusions and definition of done | Constraints, decisions, 10, 11 |

Self-review checklist for this planning artifact:

- [x] Check each source section against the coverage table and task steps.
- [x] Check that every helper referenced later has a definition/signature and an owning task.
- [x] Check the five Review Focus conditions have explicit tests or runtime checks in the owning tasks.
- [x] Check no step requires live deployment, external messages, invented credentials, or license assignment during planning.
- [x] Check proposed interpretations are distinguished from literal source requirements and current workspace facts.

## Execution handoff

Review the proposed decisions, especially RSS behavior, translation fallbacks, the demonstration direction, and client/template licensing. Choose **native execution** (one implementer works through the tasks, then a fresh whole-branch review) or **subagent-driven execution** (fresh implementer/reviewer contexts per task, then whole-branch review).

Recommendation: **subagent-driven execution**, because eleven tasks span several reusable interfaces and a mistake in configuration, route generation, or setup would be copied into future client projects. Execute in dependency order; the file map includes shared files, so this is not a request to edit tasks in parallel. No application implementation has begun.
