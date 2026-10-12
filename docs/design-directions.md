# Choosing a client direction

The shipped editorial demonstration is replaceable. Start with the client's brief and approved content, then propose two or three genuinely different directions, each with palette, typography, spacing, layout, image treatment, motion character, and accessibility constraints. Explain which content and audience needs each direction serves. Obtain the direction decision before applying client presentation.

Record the selected direction in root design-direction.md. Change src/styles/tokens.css and the replaceable components together, retain required font attribution, and check each enabled script's font coverage. Keep identity in site.config.ts, copy in content/UI data, route ownership in the manifest, and document/source language separate for fallback content.

The current specimen uses warm neutral paper, readable single-column prose, underlined blue links, light/dark system preference, and self-hosted Source Sans 3. It is a working demonstration, not a default client identity.

Validate at 360px, 768px, and 1280px, with keyboard navigation, system light/dark preference, JavaScript disabled, long headings, and UI strings 40% longer than the default. Repeat the application gates after replacement; record measured accessibility/performance results and limitations in quality-report.md.

Use a script-covering font family for each enabled language, self-host it with `font-display: swap`, and preserve its license. Source Sans 3 does not provide Arabic glyph coverage; select an Arabic font for an Arabic client. Treat fallback fonts and real translations as part of the chosen direction. Record actual browser widths, preferences, versions, URLs, and performance scores in [quality evidence](quality-report.md); headless emulation is not a physical device or screen-reader audit.
