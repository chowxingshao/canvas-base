# CLAUDE.md: Static Site Starter Template

This file tells Claude how to build and maintain this repository. It is a starter template for content-heavy, static websites with no backend. Each time it is used, it becomes a new project for a client, and the visual design should be fresh every time.

Read this whole file before changing anything.

---

## 1. Purpose

This repo is a **reusable starter**, not a finished website. It provides:

- A stable structure: content collections, routing, SEO, RSS, sitemap, build, Docker.
- An animation system built on GSAP and ScrollTrigger.
- A brief-driven workflow, so that a new client project is started by filling in one file and running one prompt.

It deliberately does **not** provide a fixed visual identity. Layouts, components, typography, colors, spacing, and motion choreography are expected to change for every project. The template should make a new design easy to produce, not preserve one design.

Typical sites: company introductions, portfolios, digital resumes, personal blogs, digital business cards, personal brand sites, landing pages, event or exhibition sites.

---

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Astro** (latest stable) | Static output by default. `output: 'static'`. |
| Language | **TypeScript** (strict) | All `.ts`, `.tsx`, `.astro` files typed where practical. |
| Content | **Astro content collections** with Markdown and MDX | Schemas defined with Zod in `src/content.config.ts`. |
| Interactive islands | **React** (only when needed) | Use `client:visible` or `client:idle`, never `client:load` by default. |
| Animation | **GSAP** with **ScrollTrigger** | Free to use. Register plugins once in `src/lib/motion/`. |
| Styling | **Plain CSS** with custom properties (design tokens) and scoped Astro styles | **Do not add Tailwind by default.** Tailwind locks in a utility vocabulary that works against per-project redesign. Only add it if the brief explicitly requires it. |
| Forms | **Third-party form endpoint** (e.g. Formspree, Web3Forms, Netlify Forms) | Endpoint URL comes from the brief. No server code in this repo. |
| Package manager | **pnpm** | Lockfile committed. |
| Lint and format | ESLint + Prettier + `astro check` | Run before every finished task. |
| Container | **Docker** multi-stage build: Node builds, nginx serves `dist/` | Must run with `docker compose up` and no extra config. |
| Hosting | Any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages) | Document in README, do not hard-wire. |
| Internationalization | Astro built-in i18n routing, optional | Off by default. Enabled through `site.config.ts` (section 17). |
| CI | GitHub Actions: lint, check, build on every pull request | Always on in the template repo. |
| CD | GitHub Actions deploy workflow, optional | Target chosen by the brief (section 18). Off by default. |
| License | MIT for the template repo itself | Client projects do not inherit it (section 16). |

No database. No authentication. No server-side API routes. No environment secrets in the client bundle.

---

## 3. The core rule: fixed layer vs. variable layer

Every file in the repo belongs to one of two layers. Respect the boundary.

### Fixed layer (stable across all projects)

These files are infrastructure. Change them only to fix bugs or to upgrade dependencies. Do not restyle them.

- `astro.config.mjs`, `tsconfig.json`, `package.json`, lint and format config
- `Dockerfile`, `docker-compose.yml`, `nginx.conf`
- `src/content.config.ts` (collection schemas, extended only when the brief needs a new collection)
- `src/lib/seo/`: meta tags, Open Graph, canonical URLs, JSON-LD helpers
- `src/lib/motion/`: GSAP registration, the reveal and scroll helper API (see section 8)
- `src/lib/config/`: loader for `site.config.ts` and the brief
- `src/pages/rss.xml.ts`, `sitemap` integration, `robots.txt` generation
- `scripts/`: any build or scaffolding scripts
- `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`
- `docs/`: template documentation (section 16)
- `.github/`: workflows, issue and pull request templates, CODEOWNERS, dependabot config
- `.editorconfig`, `.nvmrc`, `.gitignore`, `.dockerignore`, `.prettierrc`, `.prettierignore`

### Variable layer (regenerated for each project)

These files are the design. They are expected to be rewritten, replaced, or deleted per project.

- `src/styles/` (tokens, global base, reset, typography scale)
- `src/layouts/`
- `src/components/`
- `src/pages/` (page structure and section order)
- `src/assets/`, `public/` (imagery, fonts, icons)
- Any `.css` or `<style>` block
- The motion choreography: which elements animate, how, and when (in each component or page, using the fixed helper API)

When in doubt: if a choice is about how the site **looks** or **feels**, it is variable. If it is about how the site **builds**, **routes**, **indexes**, or **deploys**, it is fixed.

---

## 4. Project intake: the first thing to do in a new project

When a user starts a new project from this template, do **not** start coding immediately. Follow this sequence.

1. **Read `brief.md`** at the repo root. This is the client brief, filled in by the user. If it is missing or mostly empty, ask for the missing essentials (see section 5) in a single message, not one question at a time.
2. **Read `site.config.ts`** and fill in or confirm site-wide values: name, URL, language, contact email, form endpoint, social links.
3. **Propose 2 or 3 design directions.** Each direction is a short paragraph plus a palette sketch, a type pairing, a layout approach, and a motion character (for example: "slow, editorial, long fades" versus "snappy, kinetic, hard cuts"). Offer them as options and let the user choose. If the user says "you decide," pick the strongest one and state why in one sentence.
4. **Write the chosen direction** to `design-direction.md` at the repo root. This is the source of truth for the rest of the build. Later changes update this file first.
5. **Use the `frontend-design` skill** (if available) before writing any component or stylesheet. Avoid generic defaults: no unmodified system fonts, no stock purple gradients, no default card grids unless the brief calls for them.
6. Only then scaffold layouts, components, and pages.

If the brief says "make it creative," that is a direction to explore, not permission to skip steps 3 and 4.

---

## 5. The brief (`brief.md`)

The brief is the single file the user edits to start a project. Keep it plain Markdown with these sections. Claude should create the file from `brief.template.md` if it does not exist.

```
# Project brief

## Client and purpose
Who this site is for, what it should achieve, one or two sentences.

## Site type
One of: company, portfolio, resume, blog, business card, personal brand, landing, event, other.

## Audience
Who visits, what they want, what action they should take.

## Pages and sections
Ordered list. For each page: name, purpose, sections in order.

## Content sources
Where the content is: written by the user here, in files they will provide, or to be drafted by Claude (ask first).

## Tone and voice
Three to five adjectives, plus any words to avoid.

## Visual references (optional)
Links, screenshots, or descriptions of sites they like or dislike.

## Must-haves and must-nots
Required features, required brand colors or logo, things to avoid.

## Motion
How animated should it be? One of: none, subtle, expressive, cinematic. Any specific moments they want animated.

## Technical
Form endpoint (if any), analytics ID (if any), domain, languages, deadline.
```

Missing sections are fine. Claude asks for what it truly needs and proceeds with stated assumptions for the rest.

---

## 6. Site configuration (`site.config.ts`)

Single source for site-wide values. Only fixed fields live here. Design values do not.

```ts
export const siteConfig = {
  name: '',
  shortName: '',
  description: '',
  url: 'https://example.com',
  language: 'en',
  author: '',
  email: '',
  formEndpoint: '',       // empty means forms render disabled with a message
  social: {
    // github: '', linkedin: '', instagram: '', x: ''
  },
  analyticsId: '',        // optional
  defaultOgImage: '/og-default.png',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],      // add more, e.g. ['en', 'ms', 'zh'] — see section 17
  },
  features: {
    blog: true,
    projects: true,
    rss: true,
    motion: true,         // false disables all GSAP initialization
    i18n: false,          // false means single-language, no locale routes generated
    deploy: 'none',       // 'none' | 'netlify' | 'vercel' | 'cloudflare' | 'github-pages' | 'docker-registry'
  },
} as const;
```

Components read from this file. Never hard-code the site name, email, or URL in a component.

---

## 7. Content

Content lives in `src/content/` and is typed through collections. Copy never lives inside a component.

Default collections (keep the list short; add only what the brief needs):

- `pages`: general pages (about, services, contact copy)
- `projects`: portfolio or case study items
- `posts`: blog posts
- `services` or `offerings`: business offerings, if relevant
- `team`: people, if relevant
- `highlights`: short facts, metrics, or testimonials

Rules:

- Frontmatter is validated with Zod. A schema error must fail the build.
- Images are referenced from `src/assets/` through Astro's image pipeline, not raw strings, so they get optimized.
- Every item needs a `title`, a `description` (used for SEO), and a `draft` boolean.
- Dates use ISO format.
- Blog posts and projects generate their pages through dynamic routes (`[slug].astro`) and are included in the sitemap and RSS feed.

---

## 8. Motion system (GSAP + ScrollTrigger)

GSAP is a core part of this template. Animation should feel designed for each project, not generic.

### Fixed helper API (in `src/lib/motion/`)

Build these once. Components use them. Do not reimplement plugin registration per component.

- `registerMotion()`: registers `ScrollTrigger` (and any other plugins used) with GSAP exactly once. Safe to call multiple times.
- `motionEnabled()`: returns false when `siteConfig.features.motion` is false, or when the user has `prefers-reduced-motion: reduce` set. Every animation checks this first.
- `reveal(element, options)`: the standard entrance animation, driven by `data-reveal` attributes. Options: direction, distance, duration, delay, ease, stagger.
- `scrollScene(element, timeline, options)`: wraps a GSAP timeline in a ScrollTrigger with start, end, scrub, pin, and markers options.
- `motionContext(root)`: returns a `gsap.context()` scoped to a root element. Always use this for component-level animations so cleanup is automatic.
- `refreshOnLoad()`: calls `ScrollTrigger.refresh()` after fonts and images load. Required, or pinned sections will drift.

### Rules

1. **Content must be visible without JavaScript.** Set the starting state (opacity, transform) with JS, not with CSS, so a failed script leaves the page readable. Never hide text with CSS waiting for an animation.
2. **Every animation respects reduced motion.** When `motionEnabled()` is false, the element is left in its final state immediately.
3. **Clean up on navigation.** Use `motionContext` and call `ctx.revert()` on teardown. Astro view transitions must not leak triggers.
4. **Initialize per island or per page, not globally with side effects.** Use `<script>` tags in Astro components or small `client:visible` islands for React-based motion.
5. **Refresh ScrollTrigger after layout changes**, including font loading, image loading, and any section that changes height.
6. **Limit the number of ScrollTriggers.** Prefer one timeline per section over many small triggers. Test on a mid-range phone.
7. **Animate transform and opacity** where possible. Avoid animating layout properties like width, height, top, and left unless there is no alternative.
8. **Motion is part of the design.** Each project's `design-direction.md` must define the motion character: easing family, duration range, which section types get which entrance, and whether pinned or scrubbed scenes are used.
9. **Motion must not block interaction.** Links, buttons, and forms stay usable during every animation.

### Motion patterns to offer, not impose

Choose per project from the brief. Do not apply all of them.

- Staggered text reveals on headings
- Parallax on imagery (use `scrub`, keep subtle)
- Pinned sections with scrubbed timelines for storytelling
- Horizontal scroll sections
- Counter animations for metrics
- Cursor or hover effects (desktop only, with a fallback)
- Page transitions via Astro view transitions combined with GSAP

---

## 9. Components and layouts

- Build components per project, guided by `design-direction.md`. Do not carry over components from a previous project unless the user asks.
- Components are props-driven. No hard-coded copy, no hard-coded colors, no hard-coded site identity.
- Use design tokens from `src/styles/tokens.css` for every color, spacing value, radius, shadow, and font size. No raw hex values in components.
- Each component has one job. Compose sections from small components.
- Semantic HTML: `header`, `nav`, `main`, `section` with headings, `article`, `footer`. Each page has one `h1`.
- Interactive components (menus, tabs, accordions, modals) must be keyboard accessible and announce state with ARIA where needed.
- Mobile first. Test at 360px, 768px, and 1280px before calling anything done.

---

## 10. Accessibility and performance

Targets for every page:

- Lighthouse: 95+ performance, 100 accessibility, 100 best practices, 100 SEO, on desktop and mobile
- Color contrast at WCAG AA minimum
- All images have `alt` text (empty `alt=""` only for decorative images)
- All interactive elements focusable and visibly focused
- Respect `prefers-reduced-motion` and `prefers-color-scheme`
- Fonts: self-host, use `font-display: swap`, subset where possible
- JavaScript budget: keep island and motion code small; no unused React on static pages
- Images: use Astro's image component, lazy-load below the fold, serve modern formats

---

## 11. SEO

- Each page has a unique `<title>`, meta description, canonical URL, and Open Graph and Twitter tags
- JSON-LD structured data: `Person` for portfolios and resumes, `Organization` for company sites, `Article` for blog posts, `LocalBusiness` only if the brief says so
- `sitemap.xml` and `robots.txt` generated at build time
- RSS feed when `features.blog` is true
- Semantic heading hierarchy, no skipped levels

---

## 12. Forms

- Forms post to `siteConfig.formEndpoint`. No server code in this repo.
- If `formEndpoint` is empty, render the form in a disabled state with a clear message, not a broken form.
- Include a honeypot field and basic client-side validation. Never rely on client validation alone.
- Labels on every input. Error messages announced to screen readers.
- Do not store personal data in the browser (no localStorage for form contents).

---

## 13. Docker and deployment

- `Dockerfile` is multi-stage: `node:<lts>-alpine` for install and build, then `nginx:alpine` serving `dist/`.
- `docker-compose.yml` exposes port 8080 and needs no extra configuration.
- `nginx.conf` sets: gzip or brotli, cache headers for hashed assets (long), no-cache for HTML, security headers (CSP, X-Content-Type-Options, Referrer-Policy), and a 404 page.
- Deployment guides for Netlify, Vercel, and Cloudflare Pages go in `README.md`. Do not add provider config files unless the brief names a host.

---

## 14. Commands

```bash
pnpm install
pnpm dev            # local dev server
pnpm build          # static build to dist/
pnpm preview        # serve dist/ locally
pnpm check          # astro check + type check
pnpm lint           # eslint + prettier check
docker compose up --build   # run the production build in nginx
```

Every change should leave `pnpm check`, `pnpm lint`, and `pnpm build` passing.

---

## 15. Workflow for a new project

1. User copies the template (or uses it as a repo template) and renames the project.
2. User fills in `brief.md` and `site.config.ts`, or tells Claude the basics in chat.
3. Claude follows section 4: intake, design directions, `design-direction.md`.
4. Claude builds the variable layer: tokens, layouts, components, pages, motion.
5. Claude writes or updates content in `src/content/`.
6. Claude runs `pnpm check`, `pnpm lint`, `pnpm build`, and reviews the built output on mobile and desktop widths.
7. Claude updates `README.md` with project-specific notes (what was built, deployment target, anything left for the client to supply).

---

## 16. Repository standards and documentation

This repo is public and should look like a well-maintained open source project. Treat every file as something a stranger will read.

### Required files at the root

- `README.md`: what the template is, who it is for, a quick start (three commands or fewer), a feature list, a folder map, the fixed-versus-variable explanation, deployment options, and links to `docs/` and `CONTRIBUTING.md`. Include badges only for CI status and license.
- `LICENSE`: MIT text with the copyright holder from `site.config.ts` or the repo owner. Do not invent a license. If the owner has not confirmed MIT, ask before writing it.
- `CONTRIBUTING.md`: how to set up locally, branch and commit conventions, how to run checks, how to propose a design or feature change, and what kinds of contributions are welcome.
- `CODE_OF_CONDUCT.md`: use the Contributor Covenant text unchanged, with a contact placeholder for the maintainer.
- `SECURITY.md`: how to report vulnerabilities privately, expected response time, and supported versions.
- `CHANGELOG.md`: follow Keep a Changelog format. Every user-visible change gets an entry under Unreleased before merging.
- `.editorconfig`, `.nvmrc` (pins the Node LTS version), `.gitignore`, `.dockerignore`, Prettier config.

### GitHub repo hygiene

- `.github/ISSUE_TEMPLATE/` with bug report and feature request forms
- `.github/pull_request_template.md` with a checklist: checks pass, docs updated, changelog updated, screenshots for visual changes
- `.github/CODEOWNERS` assigning the maintainer to all paths
- `.github/dependabot.yml` for npm, GitHub Actions, and Docker, grouped by minor and patch updates
- Branch protection is documented in `CONTRIBUTING.md`, not enforced by code

### Versioning and commits

- Semantic Versioning for the template: breaking changes to the fixed layer bump the major version
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`) so the changelog can be read and generated
- Tag releases on `main`. Each release lists the template changes that affect projects created from it, and migration notes for any breaking change

### Documentation in `docs/`

Keep documentation as small, focused Markdown files:

- `docs/getting-started.md`: first run, first project, first deploy
- `docs/architecture.md`: folder structure, fixed versus variable layers, data flow for content and motion
- `docs/brief.md`: how to fill in the brief and what Claude does with it
- `docs/design-directions.md`: how a design direction is chosen and recorded
- `docs/content.md`: collections, schemas, adding a new collection
- `docs/motion.md`: the GSAP helper API, reduced motion rules, performance notes
- `docs/i18n.md`: enabling locales, translating content, routing rules
- `docs/deployment.md`: each supported deploy target, with the required secrets and their names (never values)
- `docs/decisions/`: architecture decision records, one file per decision, numbered (`0001-use-astro.md`, `0002-plain-css-over-tailwind.md`, and so on)
- `docs/troubleshooting.md`: common build, motion, and deploy errors

Every feature added to the template must update the relevant doc in the same change.

### Maintainability

- Keep dependencies few. Each new dependency needs a one-line justification in `docs/decisions/`.
- Pin exact major versions in `package.json` and commit the lockfile.
- Prefer small, boring code. Comments explain why, not what.
- Add tests where logic exists: content schema validation, the i18n route helper, the motion enable check, and the SEO metadata builder. Use Vitest. Do not test visual output.
- A template change is not done until a fresh project generated from it passes `pnpm check`, `pnpm lint`, and `pnpm build` without edits.

---

## 17. Internationalization (optional)

Multi-language support is off by default and enabled per project.

- Enable by setting `features.i18n: true` and listing locales in `site.config.ts`. When it is false, do not generate locale routes, locale switchers, or translation files.
- Use Astro's built-in i18n routing. Default locale lives at the root path, others under their locale prefix, for example `/ms/about`.
- Content is organized by locale: `src/content/<collection>/<locale>/<slug>.md`. A missing translation falls back to the default locale and is logged in the build output, not silently hidden.
- UI strings (navigation labels, form messages, button text, accessibility labels) live in `src/i18n/<locale>.json`. Components read strings through one helper, never hard-coded text.
- Each page sets `lang` on `<html>`. Each page includes `hreflang` alternate links for every locale it exists in, and the sitemap includes all locales.
- A language switcher appears only when more than one locale is enabled.
- Locale-specific formatting (dates, numbers, currency) uses `Intl` with the locale code. Do not format dates by hand.
- Right-to-left languages: the layout must support `dir="rtl"`. Use logical CSS properties (`margin-inline-start`, not `margin-left`) in all new styles.
- Font choice must cover every script the project uses. Check this as part of the design direction for each project.
- Motion and layout must be tested with the longest translated strings, since some languages run 30 to 40 percent longer than English.

---

## 18. Continuous integration and delivery

### CI (always on in the template repo)

A GitHub Actions workflow runs on every pull request and on push to `main`:

1. Install with pnpm using the lockfile (`--frozen-lockfile`)
2. `pnpm lint`
3. `pnpm check`
4. `pnpm test`
5. `pnpm build`
6. Build the Docker image (no push)

Use `actions/cache` for the pnpm store. Pin actions to a major version tag.

### CD (optional, controlled by `features.deploy`)

When `deploy` is set to something other than `none`, include the matching workflow. When it is `none`, do not generate deploy workflows.

- `netlify`, `vercel`, `cloudflare`: deploy the `dist/` artifact on push to `main` (or the branch named in the brief). Secrets are referenced by name in `docs/deployment.md`. Never write secret values into the repo.
- `github-pages`: build and publish via the official Pages action.
- `docker-registry`: build the image on tag push and push to GitHub Container Registry, tagged with the version and `latest`.

Rules for every deploy workflow:

- Deploys run only from protected branches or tags
- Preview deploys for pull requests where the host supports them, with the preview URL posted as a PR comment
- A failed build never deploys. CI must pass first.
- Deploy workflows are generated per project. The template repo itself ships a commented example for each target, not an active one.

---

## 19. Things not to do

- Do not add a backend, API routes, databases, or auth to this template.
- Do not add Tailwind, a component library (MUI, Chakra, shadcn), or a UI kit unless the brief explicitly requires it.
- Do not reuse a previous project's visual design, palette, or component styles by default.
- Do not hard-code copy, colors, or site identity inside components.
- Do not use `client:load` for components that can wait.
- Do not animate with CSS keyframes and GSAP on the same element.
- Do not create ScrollTriggers without cleanup.
- Do not ship placeholder lorem ipsum without flagging it to the user.
- Do not commit secrets or API keys. Form endpoints that are public URLs are fine.
- Do not add new dependencies without a reason stated in the README.
- Do not ship a client project under the template's MIT license. A generated project gets its own license, chosen by the client or agency, and the template's `LICENSE` and open source files are removed or replaced. Ask which applies.
- Do not leave template-only files in a client project (CONTRIBUTING, CODE_OF_CONDUCT, example deploy workflows) unless the client wants them.
- Do not enable i18n or a deploy target the brief did not ask for.

---

## 20. Definition of done

A project is done when:

- `design-direction.md` exists and matches what was built
- All pages from the brief exist and have real or clearly marked placeholder content
- `pnpm check`, `pnpm lint`, and `pnpm build` pass with no errors
- Lighthouse targets in section 10 are met, or the gap is documented
- Motion works and is disabled cleanly under reduced motion
- The Docker image builds and serves the site
- `README.md` describes how to run, deploy, and edit the content
- No fixed-layer file was restyled, and no variable-layer file was left with a previous project's leftovers
- `features.i18n` and `features.deploy` match what the brief asked for, and the matching workflows and locale files exist only when enabled
- The README and `docs/` describe the project as built, and `CHANGELOG.md` has an entry for the initial build
- Template-only open source files are removed or replaced as section 19 requires
