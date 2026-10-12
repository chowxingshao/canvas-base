# 0003: Pin a compatible dependency toolchain

Status: Accepted

Resolve stable releases from the npm registry, check runtime and peer requirements, and save exact direct versions plus `pnpm-lock.yaml`. The 2026-10-08 matrix uses Node 24.21.0 (latest active-LTS patch from the official Node release index) and pnpm 12.8.1 (the installed, verified launcher).

TypeScript 7.0.2 was the latest stable release, but Astro check 0.9.10 requires TypeScript 5 or 6 and TypeScript ESLint 8.71.1 requires TypeScript below 6.1. Use compatible TypeScript 6.0.3. Astro 7.3.7 satisfies MDX 8.0.3's Astro peer requirement. Node 24.21.0 satisfies Astro, Vitest, jsdom, and the Astro ESLint plugin. Node 24.19.0 was the available implementation host and also satisfies their engines.

## Direct dependencies and reasons

| Dependency                 | Exact version | Reason                                                           |
| -------------------------- | ------------- | ---------------------------------------------------------------- |
| `astro`                    | 7.3.7         | Generate static HTML and provide typed content/config APIs.      |
| `@astrojs/mdx`             | 8.0.3         | Compile Markdown with embedded Astro-compatible components.      |
| `@astrojs/sitemap`         | 3.7.4         | Provide the supported sitemap integration for SEO work.          |
| `@astrojs/rss`             | 4.0.19        | Generate prerendered RSS feeds during SEO work.                  |
| `gsap`                     | 3.15.0        | Provide motion and ScrollTrigger APIs for motion work.           |
| `typescript`               | 6.0.3         | Type-check all TypeScript using compatible stable tooling.       |
| `@astrojs/check`           | 0.9.10        | Type-check and diagnose Astro templates.                         |
| `@types/node`              | 24.19.1       | Type Node 24 build and filesystem APIs.                          |
| `eslint`                   | 10.12.0       | Lint maintained source.                                          |
| `@eslint/js`               | 10.0.1        | Supply the recommended JavaScript rule set.                      |
| `typescript-eslint`        | 8.71.1        | Supply TypeScript parsing and lint rules.                        |
| `eslint-plugin-astro`      | 3.2.1         | Supply Astro parsing and lint rules.                             |
| `eslint-plugin-jsx-a11y-x` | 0.2.0         | Supply Astro accessibility rules with ESLint 10 compatibility.   |
| `prettier`                 | 3.9.9         | Apply consistent source and documentation formatting.            |
| `prettier-plugin-astro`    | 1.1.0         | Add Astro template formatting.                                   |
| `vitest`                   | 5.0.3         | Exercise application logic with Astro's Vite setup.              |
| `jsdom`                    | 30.1.2        | Parse build output and supply the DOM behavior test environment. |
| `@types/jsdom`             | 30.0.0        | Type actual HTML/XML fixture inspection with installed jsdom.    |

Astro exposes Zod via `astro/zod`; no separate validation dependency is needed. React, UI kits, Tailwind, and server adapters are absent.

pnpm 12 blocks unapproved dependency install scripts, so `pnpm-workspace.yaml` explicitly allows only esbuild. Astro ESLint supports either the legacy JSX accessibility plugin or the compatible `-x` fork; exclude the legacy optional peer, whose current ESLint range ends at 9. The same file preserves pnpm's exact `astro@7.3.7` release-age exclusion; it does not disable the release-age policy globally.

## References

- [Astro testing configuration](https://docs.astro.build/en/guides/testing/)
- [Astro configuration](https://docs.astro.build/en/reference/configuration-reference/)
- [Node release index](https://nodejs.org/dist/index.json)
- [Astro npm registry metadata](https://registry.npmjs.org/astro)
- [TypeScript ESLint npm registry metadata](https://registry.npmjs.org/typescript-eslint)

Task 5 resolved @types/jsdom 30.0.0 from the npm registry on 2026-10-09 and pinned it as a dev dependency. jsdom does not bundle these declarations; the package supports typed inspection of real built HTML and XML without a runtime dependency change.
