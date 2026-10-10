# Replaceable demonstration direction

This starter displays an editorial specimen, not a permanent brand. Before client work, read the brief, propose two or three distinct directions, select one with the client, and replace this document and the presentation.

The light palette is warm paper (#f8f6f1), a quiet surface (#efede6), charcoal text (#242724), muted text (#565b55), and a single blue link accent (#2153b8). Dark preference uses green-charcoal paper (#1d211f), surfaces (#292f2b), cream text (#f3f1e9), muted text (#bfc5bb), and pale blue links (#a0bfff). All values live in src/styles/tokens.css. Links remain underlined; keyboard focus uses a contrasting 3px outline with a 4px offset.

Self-hosted Source Sans 3 supplies upright variable weights 200–900 with font-display: swap. The Latin-facing file is the unmodified 170,188-byte upright TTF WOFF2 from Adobe's official release, retaining its original names and public/fonts/OFL.txt. It also covers Greek/Cyrillic; it is not a custom subset. Source: https://github.com/adobe-fonts/source-sans/tree/release/WOFF2/VF and https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md. A client may subset its approved font while respecting reserved names and licensing. Configure a matching self-hosted script font whenever a client's enabled language falls outside this font's coverage, including Arabic. Browser fallback in the Arabic routing test is not a finished Arabic design.

Body text is 18px at the standard root size with 1.65 line height. Fluid headings span 36–64px. Reading text stays within 44rem, inside a 70rem shell. The spacing scale is 0.5, 1, 1.5, and 2.5rem, with fluid 3–6rem page sections. Simple navigation wraps naturally. Entry lists use separators and optional images rather than a fixed card system. Logical properties support both directions.

Motion character: power2.out, 0.35–0.6 seconds, short vertical section entrances. No default pinning or cursor effects. The Task 7 helper layer scopes every page animation and cleans it up during navigation; content is visible immediately and works without JavaScript or when reduced motion is requested.

Normal text and blue links must meet WCAG AA contrast against their backgrounds in both schemes; verify the selected client palette again after every change. The skip link becomes visible on focus. Task 4 verification and outstanding quality evidence are recorded in docs/quality-report.md.
