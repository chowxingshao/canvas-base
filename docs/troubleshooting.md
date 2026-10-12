# Troubleshooting

Use Node from `.nvmrc` and pnpm from `package.json`, then `pnpm install --frozen-lockfile`. If a frozen install fails, check the package manifest and lockfile change together. Do not bypass the lockfile to hide an incompatible dependency update.

## Local gates

- `pnpm lint`: ESLint errors require source fixes. For formatting-only failures, run `pnpm format` and review the resulting diff.
- `pnpm check`: review Astro and TypeScript diagnostics. Keep Node-only modules out of browser code and `astro:content` out of Node config.
- `pnpm test`: run the named failing test first. Integration tests build isolated fixtures and can take longer than unit tests.
- `pnpm build`: invalid content, missing assets, unsafe URLs, or inconsistent locales intentionally fail the build. Fix the source rather than removing validation.

## Configuration and output

Published content must have `draft: false`, valid required fields, and an enabled feature. A missing translation can fall back to published default content; inspect the build warning and add a real translation. Fallbacks canonicalize to their source and are omitted from sitemap/hreflang.

For project-path hosting, set both the real origin and `base` in site config, then rebuild. Test URLs and assets from that mount. Generated nginx files live in `.generated/`; rebuild rather than editing them.

A disabled contact form requires a public endpoint before native submission is available. Check provider field names and form-action CSP when configuring one. Motion keeps content readable when disabled, reduced motion is requested, or a dynamic import fails.

## Docker and CI

If Docker cannot connect, start Docker Desktop or the daemon and confirm `docker info` succeeds. Port 8080 must be free for Compose. Build with `docker compose up --build -d`, run `pnpm verify:container`, and stop only this stack with `docker compose down`. Record daemon limitations rather than claiming container checks passed.

CI installs frozen dependencies, then runs lint/check/test/build and Docker build sequentially. The first failed step stops normal later steps; `site-dist` is uploaded only on success. Read the first failing stage's log. A cache miss is harmless; cached pnpm store data never replaces installation or validation. The workflow deliberately uses a checkout directory containing a space.

Deployment jobs require the reusable CI job and download its artifact. Check artifact name `site-dist`, repository/environment protection, and provider secrets. A local actionlint result checks workflow syntax and expressions; it does not prove a hosted GitHub run or provider deployment.

If `pnpm configure:project` reports a generated file was modified, review that exact path and its ownership in `.canvas/generated.json`. Restore the generated file or deliberately resolve ownership after preserving authored changes. Never bypass the conflict by deleting arbitrary client files. See [deployment](deployment.md) and [brief workflow](brief.md).

## Fresh acceptance failure

`pnpm verify:fresh` prints its temporary destination and retains failed copies. Inspect the failed command there; never fix acceptance by editing the copy. Fix maintained source, then rerun the command. Installs need registry access or a populated pnpm store. On Windows run through pnpm so the script can resolve its native executable; it uses argument arrays without a command shell. Symlinks, populated destinations, and missing/tampered temporary ownership markers are intentionally rejected. No cleanup command removes arbitrary user directories. Docker verification requires a running local Linux-container daemon.
