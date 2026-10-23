# Agent and contributor guidance

This file is the single source of agent guidance for this repository. Read [architecture](docs/architecture.md), [contribution workflow](CONTRIBUTING.md), and [getting started](docs/getting-started.md) before changing anything here. For a client project, also follow the [brief workflow](docs/brief.md). These documents are the shared authority for agent and human work.

Apply the distinction between template maintenance and creating a client site. Keep validation and reporting requirements identical regardless of who does the work; do not treat the demonstration design as a permanent template identity.

## Template maintenance vs. client projects

For template maintenance, improve the fixed infrastructure layer while preserving public configuration, content, routing, SEO, and motion contracts. For a client project, follow the [brief workflow](docs/brief.md), record its direction, and replace the variable presentation layer. Read an existing brief before editing copy or design.

## Contracts to preserve

Keep static output, strict TypeScript, plain CSS, public config without secrets, content visible without JavaScript, and reduced-motion cleanup. UI copy lives in content dictionaries; routes, navigation, SEO, and discovery share the manifest. Add React only for a demonstrated island requirement; use `client:visible` or `client:idle` by default. Add dependency justifications to README and a decision record.

## Validation and reporting

Test logic changes, run `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build`, and update documentation and CHANGELOG. Validate Docker or generated workflows when affected. Include browser evidence for visual changes using the contribution checklist. Report actual results and limitations.

## Governance

Review ownership, license, governance, and third-party notices for client copies using CONTRIBUTING.md. Do not automatically delete governance or upstream legal notices. Deployment is opt-in through typed config and reviewed generated workflows; implementing a template does not authorize publishing, remote setting changes, release tags, or messages.
