# Release quality evidence

Acceptance measured on **2026-10-12**, Asia/Kuala_Lumpur, on Windows with Node **24.19.0**, pnpm **12.8.1**, Astro **7.3.7**, Playwright **1.62.1**, and headless Microsoft Edge **155.0.4283.45**. The recommended pinned Node is 24.21.0; local Node 24.19.0 satisfies the declared engine range. These are emulated browser checks, not physical-device, screen-reader, or hosted-provider certification.

## Application and copy acceptance

`pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` passed: zero Astro/TypeScript diagnostics, **212 tests in 16 files**, and eight static demo pages. `pnpm verify:fresh` also passed frozen installation, check, lint, all tests, and build in a new `Client Sites/Test One` temporary directory. SHA-256 snapshots confirmed copied and original release source needed no edits; successful owned temporary copies were removed. Its four small boundary tests cover exclusions, source preservation, paths with spaces, unsafe destinations, symlinks, and cleanup ownership. The normal suite never recursively launches acceptance.

Seven separate fixture builds passed artifact inspection:

| Fixture                   | Inspected result                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Defaults                  | Eight demo pages and public discovery files; no private build route.                                                |
| Blog/projects/RSS off     | No disabled routes, navigation links, or feed.                                                                      |
| RSS alone off             | No feed file or head discovery link; content remains.                                                               |
| Motion off                | Static headings remain visible; browser content stays visible with no-preference motion.                            |
| en/ms missing translation | Requested document language, English source article, source canonical, warning, and fallback omitted from sitemap.  |
| Arabic RTL                | Arabic document language/direction and English fallback article language; logical layout and long Arabic UI stress. |
| `/demo/` hosting          | Mounted links and sitemap URLs; generated document tree serves the mount.                                           |

## Browser coverage

The default production build was served by `astro preview` at `http://127.0.0.1:4387`. Home, about, contact, blog index, post, projects index, project detail, and 404 were checked at **360, 768, and 1280 pixels**, each in light/dark and normal/reduced/no-JavaScript modes. The **162 checks** include long heading/navigation stress. Each page retained one visible h1, a loaded local font, no horizontal overflow, a keyboard skip link targeting main, and visible subsequent keyboard focus. No page exceptions or console errors were recorded. Representative 360px contact, 768px project detail, 1280px home, and 360px Arabic dark screenshots were visually inspected; every page/width received automated DOM inspection and a captured reduced-motion light screenshot.

A separate **72-check** browser run covered normal-motion home/contact, Malay fallback, Arabic RTL, motion off, and mounted fixtures in both colors at all three widths, with long UI strings. A local Node static fixture server applied the exact generated CSP response headers; it recorded no CSP console errors, page exceptions, hidden headings, or horizontal overflow. This verifies browser compatibility with the policy; it does not verify nginx response behavior. Arabic glyphs use system fallback in this fixture: a client must select and self-host a script-covering font and approve actual translations.

## Lighthouse measurements

Lighthouse **13.5.0** audited every default page against the static production preview on 2026-10-12. Desktop used the desktop preset: 1350x940, DPR 1, simulated 40 ms RTT/10,240 Kbps, CPU multiplier 1. Mobile used the Moto G Power user-agent preset: 412x823, DPR 1.75, simulated 150 ms RTT/1,638.4 Kbps, CPU multiplier 4. These URLs use local HTTP; no deployed host or nginx Lighthouse run is claimed.

Scores below are performance/accessibility/best-practices/SEO:

| Route                        | Desktop            | Mobile initial     |
| ---------------------------- | ------------------ | ------------------ |
| `/`                          | 100/100/100/100    | 98/100/100/100     |
| `/about/`                    | 100/100/100/100    | 98/100/100/100     |
| `/contact/`                  | 100/100/100/100    | 98/100/100/100     |
| `/blog/`                     | 100/100/100/100    | **87**/100/100/100 |
| `/blog/welcome/`             | 100/100/100/100    | 98/100/100/100     |
| `/projects/`                 | 100/100/100/100    | 98/100/100/100     |
| `/projects/example-project/` | 100/100/100/100    | 98/100/100/100     |
| `/404.html`                  | 100/100/100/**66** | 100/100/100/**66** |

The mobile blog index initially missed performance >=95: 475 ms total blocking time while another browser fixture audit ran concurrently. Three subsequent isolated runs scored **98/100/100/100**, with 46, 38, and 49 ms blocking time. The initial outlier is retained; concurrent CPU load is a likely contributor, not a proven sole cause. Follow-up is to repeat isolated measurements on the actual production host and a representative device, investigating startup JavaScript if blocking time persists. No source change was made to conceal that measurement. All indexable pages reached the target in the isolated recorded measurements; this is not a guarantee for future runs or client content.

The 404's only failed SEO audit is indexing eligibility, caused by intentional `noindex, follow`. Keep that policy and exclude error pages from an indexable-page SEO target; do not make a 404 crawlable to improve its score.

## Docker and publication limits

Final Docker acceptance could **not** run: Docker CLI 29.7.2 was present, but the Linux daemon pipe `dockerDesktopLinuxEngine` was unavailable, including after starting Docker Desktop. `docker compose -p canvas-task-11 up --build -d` failed before creating resources, and `pnpm verify:container` returned `fetch failed`; cleanup of only that named project was attempted and also could not connect. Root and `/demo/` HTTP/cache/gzip/status checks therefore remain unverified in this final environment. Task 8 recorded earlier successful local root/mount checks; those are historical evidence, not a final rerun. Generated-header unit tests and the browser CSP fixture passed.

Raw Lighthouse reports, browser JSON/screenshots, fixture results, command logs, and the detailed task report are retained under ignored `.superpowers/sdd/2026-10-08-canvas-base/task-11-*` in the maintenance workspace. They are excluded from released starter copies; this summary is included.

MIT and copyright 2026 chowxingshao are owner-confirmed, and required font/third-party notices remain. **Publication readiness remains open:** the private security channel/response expectations and conduct contact are unconfirmed; remote protections and environment controls are not configured or verified. Hosted CI runs, Netlify/Vercel/Cloudflare/Pages/GHCR deployments, preview posting, physical devices, screen readers, and real provider form delivery remain untested. No remote settings, push, release tag, publication, or deployment occurred.
