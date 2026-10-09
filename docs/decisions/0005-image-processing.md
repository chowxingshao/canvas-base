# Direct image processing dependency

Exact sharp@0.35.5 is a direct dependency because Astro 7.3.7's prerender image service dynamically imports Sharp from the project root, and actual Image routes fail with MissingSharp when pnpm exposes it only as Astro's optional transitive dependency. Version 0.35.5 was already installed transitively; no unrelated dependency versions were changed. The real pages integration build includes the project cover image.
