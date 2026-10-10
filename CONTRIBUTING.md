# Contributing to Canvas Base

Use Node from `.nvmrc` and pnpm from `package.json`. Start with [getting started](docs/getting-started.md), [architecture](docs/architecture.md), and the [brief workflow](docs/brief.md). Read the [Code of Conduct](CODE_OF_CONDUCT.md). Its official Contributor Covenant 2.1 text retains the contact placeholder because no conduct reporting contact has been confirmed. Maintainer action is required to replace that designated field before claiming community reporting is ready.

## Scope and checks

Template maintenance changes reusable infrastructure in the fixed layer. A client site starts from its brief and replaces the variable presentation layer; it should not turn client-specific design into a template requirement. Keep secrets out of site config and content.

Keep changes focused. Add tests for logic, rather than static prose or visual styling. Run `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` before requesting review. For serving changes, also build Docker and run `pnpm verify:container` against the local stack. For workflow changes, validate CI and each affected generated deployment workflow with actionlint. Record browser evidence for visual changes at 360, 768, and 1280 pixels, keyboard navigation, reduced motion, and JavaScript disabled. Do not claim checks that were not run.

Update the changelog and relevant documentation. Every new dependency needs a one-line reason in README and a decision record under `docs/decisions/`. Preserve exact dependency pins and the frozen lockfile. Open a pull request using the repository checklist; include results and any limitation.

## Commits, versions, and releases

Use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): for example `fix: preserve base paths in feeds`, `feat: add a content helper`, or `docs: explain form setup`. Use `!` or a `BREAKING CHANGE:` footer for incompatible fixed-layer API changes.

Use [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) for the fixed layer: patch for compatible fixes, minor for compatible additions, major for incompatible public config, content schema, routing, or helper contracts after 1.0. While the template is 0.x, document every incompatible change explicitly and advance the minor version. Demo presentation changes do not define a public API. Release notes must include migration steps and affected interfaces, including feature/default changes.

Prepare releases from reviewed commits on `main`. Run all standard gates and fresh-copy acceptance before tagging `vX.Y.Z`; update package version and changelog together. A release tag does not authorize deployment. Never publish an unverified release or automatically merge dependency updates. Dependabot groups minor/patch changes for npm, Actions, and Docker; majors remain separate pull requests and require explicit compatibility review. Inactive deployment templates also require manual dependency review because Dependabot may not scan `.yml.template` files.

## Repository administrator setup

Configure branch protection or a ruleset for `main`: require pull requests, a review including CODEOWNERS where appropriate, successful `Validate template` CI, resolved conversations, and protection against force pushes and deletion. After the first real GitHub run, select its exact reported check name; locally validated YAML does not prove the remote check is available. Require the same verified checks for release tags using repository rulesets. Review who can bypass protections.

Configure production environment reviewers and allowed branches/tags before enabling any deployment. Set up private vulnerability reporting as described in [SECURITY.md](SECURITY.md), and supply a conduct reporting contact. These are administrator tasks; adding these files does not enable remote protections.

## Reviewed checklist for client copies

Open-source template governance describes this upstream community. Review it for every client rather than presenting upstream maintainers as responsible for that client's site. Make these edits in a reviewed change; no cleanup script deletes governance.

- Confirm client code ownership, license, and distribution requirements. Retain the upstream MIT copyright and permission notice for reused template code.
- Retain third-party notices, including `public/fonts/OFL.txt`, dependency licenses, and required attribution.
- Replace CODEOWNERS with actual client maintainers. Review issue and PR templates, Dependabot, and contribution/release policy.
- Replace or remove CONTRIBUTING, CODE_OF_CONDUCT, and SECURITY only after deciding the client's support and private reporting process; do not leave upstream contact expectations attached to a client.
- Adapt README, agent instructions, and workflow references to the client's architecture and brief. Keep CI gates and review the selected hosting setup.

For problems with local tooling, see [troubleshooting](docs/troubleshooting.md).
