# Quality evidence

Task 4 introduces semantic, static demonstration pages. Automated integration builds check every default route, one h1, skip/main landmarks, rendered MDX, an Astro Image cover with descriptive alt and lazy loading, disabled feature routes/links, single-language suppression, mounted locale links, source article language, and Arabic document direction.

Lighthouse desktop/mobile targets (95+ performance; 100 accessibility, best practices, SEO) remain unmeasured at Task 4. Task 5 adds the remaining SEO output, and Task 11 owns the final fresh-project and browser audit. Do not report these targets as achieved without recorded measurements.

Manual browser verification and gate results are appended after the Task 4 validation run. No pixel snapshot tests are used.

Task 4 browser audit used local headless Microsoft Edge at 360px, 768px, and 1280px in light and dark preferences with JavaScript disabled. Home, project index/detail, MDX post, and 404 had one visible h1, a loaded local font, and no horizontal overflow. Keyboard Tab revealed the skip link with a solid focus outline; Enter focused main-content. Long headings and navigation labels expanded by at least 40% remained readable without overflow. Screenshots were inspected at the three required sizes; evidence is kept under the ignored .superpowers/sdd task directory.

The font is the unmodified upstream variable WOFF2 (170,188 bytes), preserving reserved names and full upstream coverage rather than redistributing a custom subset. Its Latin-facing filename does not claim Arabic coverage. A matching self-hosted font for additional scripts remains part of each client's direction.

Task 4 final gates: pnpm test passed 157 tests across seven files; pnpm lint passed ESLint and formatting; pnpm check reported zero errors, warnings, or hints; pnpm build generated eight pages and the project cover. The initial full suite exposed a content fixture that inserted Malay content without declaring Malay in config; its locale declaration was corrected while its original content assertions were preserved.

Calculated contrast against page background (text / muted / links / focus): light 13.98 / 6.43 / 6.49 / 8.06; dark 14.40 / 9.24 / 8.83 / 10.28. These values describe the demo tokens and do not replace a complete assistive-technology or Lighthouse audit.
