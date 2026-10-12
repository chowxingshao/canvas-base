# Contact form deployment

## Docker and Nginx

Build and run the production image locally with `docker compose up --build -d`.
It serves the static build at [http://localhost:8080](http://localhost:8080), then
`pnpm verify:container` checks its status codes, caching, gzip, and security
headers. Use `pnpm verify:container demo` after building a configuration with
`base: '/demo/'`. Stop the local stack with `docker compose down`.

The build copies only generated static HTML, assets, and Nginx includes into the
runtime image. HTML is revalidated with `Cache-Control: no-cache`; hashed Astro
assets are immutable for one year. The generated CSP hashes inline scripts and
styles, confines form submissions to the configured endpoint origin, and allows
inline style attributes because GSAP writes transform and opacity there. Local
HTTP deliberately has no HSTS header.

## Hosted deployments

Choose a target through `features.deploy` and run `pnpm configure:project` to generate exactly one workflow. The inactive templates document the required secrets and only deploy after the reusable CI workflow has verified a static artifact. Configure branch or tag protection and the production environment in the repository before enabling a deployment. Remote provider deployments and pull-request previews are intentionally unverified until a project selects a host and supplies its credentials.

Set `formEndpoint` in `site.config.ts` to the provider's public HTTP(S) submission URL, then rebuild the static site. This value is shipped in HTML; do not put secret keys, credentials, or private tokens in it. Leave it empty to show a disabled form with the configuration notice.

The configured form submits a native POST directly to the provider. It works with browser validation when JavaScript is disabled; optional local enhancement provides linked errors, an announcement, and focus on the first invalid field. The script does not fetch, log, or store submitted values. The provider controls delivery, confirmation pages, redirects, error responses, retention, and any consent requirements. Configure those with the provider before launch.

The default field names are `name`, `email`, `message`, and the `website` honeypot. When selecting a provider, check its accepted field names, honeypot name, and required public hidden fields. Adjust the component's submitted names and the enhancement's field lookup together, retaining the `ContactValues` validation interface, accessible labels, and UI dictionary copy. Document that provider's requirements for the project; no provider is selected by this starter.

The provider must enforce server-side validation and its own honeypot rules. Client validation can be bypassed, and a generic endpoint does not guarantee spam protection. A hidden `website` field only helps when the provider recognizes and rejects it; add the provider's supported protection if needed.

Before launch, verify the endpoint, privacy copy, delivery and provider responses using that provider's approved testing process. For local template checks, intercept submission or use a local endpoint so no real message is sent. Ensure the hosting security policy permits the selected provider's form action; Docker and hosting configuration are handled separately.

## CI contract and repository setup

Generated target workflows call `./.github/workflows/ci.yml` and wait for its `verify` job before deploying. CI uploads `site-dist` only after frozen installation, lint, check, test, static build, and a local Docker build all succeed. Netlify, Cloudflare, and Pages download that static artifact from the same run. Vercel downloads `site-vercel`, the static Build Output API v3 directory prepared from the verified `dist/` in CI, into `.vercel/output`; its pinned CLI receives the token through the documented [`--token` option](https://vercel.com/docs/cli/global-options#token). The Docker registry template downloads `site-image`, loads the image CI built and saved, and tags/pushes that exact image. It accepts stable `vMAJOR.MINOR.PATCH` tags only and uses the protected production environment. No deploy job rebuilds source; CI never pushes.

The CI workflow intentionally uses a checkout path containing a space. Its action majors were checked against official repositories on 2026-10-10: [checkout v7](https://github.com/actions/checkout), [setup-node v7](https://github.com/actions/setup-node), [cache v6](https://github.com/actions/cache), and [upload-artifact v7](https://github.com/actions/upload-artifact). Node is read from `.nvmrc` (24.21.0); Corepack activates pnpm 12.8.1, matching `packageManager`. Actions use supported major tags as required by the plan; review dependency updates before merging.

Protect main and selected production branches/tags, require the real CI check once available, and configure production environment approvals and allowed refs. See [administrator instructions](../CONTRIBUTING.md#repository-administrator-setup). No remote setting was changed and no hosted CI/deployment success is claimed by local validation. Private reporting setup is separately documented in [SECURITY.md](../SECURITY.md).

## Release acceptance

Run `pnpm verify:fresh` before packaging a reusable starter. Repeat Docker HTTP verification for `/` and a separate `/demo/` fixture; inspect the production browser console for CSP failures. Record daemon/tool versions and actual results in [quality evidence](quality-report.md). A Docker-unavailable result is a limitation, not a passed check. Hosted provider deployments, previews, GitHub environment settings, and branch protections remain unverified until a client supplies and reviews its host settings.
