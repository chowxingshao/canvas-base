# From a brief to a site

Run `pnpm configure:project` once after selecting a deployment target in `site.config.ts`. It preserves an existing `brief.md`; otherwise it creates one from `brief.template.md`. Treat the brief as client-owned source material, not a configuration parser.

Use this prompt with an implementation agent after the brief is complete:

> Read `brief.md`, `site.config.ts`, and `design-direction.md`. Ask for all missing essentials in one message. Then propose two or three visual directions with their rationale and constraints. Record the selected direction in `design-direction.md`, update the typed configuration and content, and only then implement the replaceable pages and components. Do not invent content, translations, provider credentials, or a deployment target.

When i18n is enabled, setup creates dictionaries from the default English UI dictionary. They are explicit English fallback copy and must be translated before launch; setup never fabricates a translation.

Before delivery, review client licensing, maintainers, security contacts, and governance using [CONTRIBUTING](../CONTRIBUTING.md#reviewed-checklist-for-client-copies). Select fonts covering every requested script, choose only the integrations the brief needs, and record provider-specific form fields and deployment settings. Replace sample content only with approved copy. Run the [release and browser acceptance](quality-report.md) after adapting the project.
