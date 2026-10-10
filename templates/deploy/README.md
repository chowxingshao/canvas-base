# Optional deployment workflows

`pnpm configure:project` copies exactly one inactive template to `.github/workflows/deploy.yml` when `features.deploy` selects a target. It never guesses a provider or creates a workflow for `none`.

Each workflow expects the reusable CI workflow introduced by this starter's CI setup to provide verified build artifacts. Repository administrators must protect the production branch or release tags and configure environment protection before deploying. Same-repository preview behavior is gated by the `ENABLE_PREVIEWS` repository variable. Fork pull requests never receive deployment credentials.

Set only the documented secrets after selecting a host: Netlify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`; Vercel `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`; Cloudflare `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_PAGES_PROJECT_NAME`. Pages and GHCR use scoped `GITHUB_TOKEN` permissions.
