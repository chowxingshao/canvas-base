# Security policy

## Supported versions

This template is pre-1.0. Security fixes are maintained on the current `main` branch and, after releases exist, the newest published 0.x release only. Older snapshots and client copies must incorporate upstream fixes themselves; this policy is not a support promise for independent client sites.

## Reporting a vulnerability

No private security email/contact or response-time commitment has been confirmed. GitHub private vulnerability reporting is the proposed channel, but its enabled state has not been verified or configured by this implementation. No acknowledgement or fix deadline is promised.

For [chowxingshao/canvas-base](https://github.com/chowxingshao/canvas-base), check the Security tab for **Report a vulnerability**. If available, use it to send a private report with affected version/commit, reproduction steps, impact, and suggested mitigation. Do not include live credentials, client personal data, or exploit details in public issues. If private reporting is unavailable, no working private channel is currently documented; a maintainer must enable it or provide a verified alternative before reporting readiness can be claimed.

Repository administrator setup: open Settings, then the security settings for vulnerability reporting and enable **Private vulnerability reporting**. Verify the report entry point is visible, assign maintainers who can triage advisories, and record a confirmed alternative/contact and response expectations here if desired. See [GitHub's setup instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository). This file does not enable the feature.

Keep site configuration public and credential-free. CI uses read-only repository permissions; optional deployment credentials belong only in the selected provider workflow's secrets and protected environments.
