# Optional deployment workflows

`pnpm configure:project` copies exactly one inactive template to `.github/workflows/deploy.yml` when `features.deploy` selects a target. It never guesses a provider or creates a workflow for `none`.

Each workflow calls the reusable CI workflow for verified build artifacts. Netlify, Cloudflare, and Pages download `site-dist`; Vercel downloads CI's `site-vercel` prebuilt output; the Docker registry workflow loads CI's saved `site-image` and publishes stable version tags plus latest without rebuilding source. Repository administrators must protect the production branch or release tags and configure environment protection before deploying. Same-repository preview behavior is gated by the `ENABLE_PREVIEWS` repository variable. Fork pull requests never receive deployment credentials.

Set only the documented secrets after selecting a host: Netlify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`; Vercel `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`; Cloudflare `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_PAGES_PROJECT_NAME`. Pages and GHCR use scoped `GITHUB_TOKEN` permissions.
