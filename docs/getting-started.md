# Getting started

Install Node 24.21.0 from `.nvmrc` and pnpm 12.8.1 from `packageManager`. Run `pnpm install --frozen-lockfile`, then `pnpm dev`.

Replace the clearly labeled demo name, short name, description, and origin in `site.config.ts`. The URL must contain only an HTTP(S) origin; paths, credentials, queries, and fragments are rejected. Use `base` for a project mount such as `/portfolio/`. It defaults to `/`, normalizes slashes, and rejects dot segments and encoded separators.

Fill in author, email, social links, analytics ID, and a public HTTP(S) form endpoint only when the project needs them. Empty optional values remain valid. All values are public: credentials and secrets belong outside this configuration.

Keep `language` equal to `i18n.defaultLocale`, include the default in `i18n.locales`, and use unique safe locale codes such as `en`, `ms`, or `zh-Hant`. Internationalization is off by default. Locale configuration is validated even when its feature flag is off.

Write the client brief in root `brief.md`. The build-only reader returns the original Markdown without interpreting it. An absent brief returns `null`; unreadable files and other filesystem problems remain errors.

Use `pnpm format` while editing. Before completing a change, run `pnpm test`, `pnpm lint`, `pnpm check`, and `pnpm build`. Then `pnpm preview` serves `dist/`. The README documents all seven scripts.

This task supplies a minimal HTML demo. Additional motion, Docker, and deployment workflows arrive in their corresponding tasks. A flag being enabled does not add those modules by itself. The default OG image path is a configuration value; supply the actual image during the asset/SEO work.

## Configure the contact form

The contact page shows a disabled form and `Contact form is not configured yet.` until `formEndpoint` has a public HTTP(S) submission URL. Set it in `site.config.ts` and rebuild to enable native POST submission. No secret key belongs in this public configuration.

Edit labels, required-field messages, and validation announcements under `contact` in `src/content/ui.json`, or the matching locale dictionary when internationalization is enabled. Contact page prose lives in `src/content/pages/en/contact.md`. The name, email, and message fields are required, and `website` is a hidden honeypot excluded from keyboard navigation and accessibility exposure.

Select a provider and follow its field naming, confirmation, and spam protection requirements in [deployment guidance](deployment.md). Providers must validate submissions server-side and enforce their own honeypot rules; the generic endpoint and local validation do not guarantee spam protection. Use intercepted local submissions during starter testing.
