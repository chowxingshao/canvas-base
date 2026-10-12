# Motion

Canvas Base uses GSAP only for optional, page-scoped progressive enhancement. Content starts visible in the HTML and CSS. When JavaScript, the motion feature, or no-preference motion support is unavailable, no helper hides or moves it.

## Helper API

Import helpers from `src/lib/motion/index.ts`.

- `motionEnabled()` checks for a browser, `siteConfig.features.motion`, and `prefers-reduced-motion`.
- `registerMotion()` registers `ScrollTrigger` once, only after motion is enabled.
- `motionContext(root)` creates a GSAP context scoped to one component or page. Add animation work with `ctx.add(() => { ... })`, then call `ctx.revert()` when the component goes away.
- `reveal(element, options)` creates the shared entrance tween. It uses `up`, `24px`, `0.5s`, `0s`, `power2.out`, and no stagger unless explicit options or valid `data-reveal-*` values replace them. Negative duration, delay, and stagger values use their defaults.
- `scrollScene(element, timeline, options)` gives one paused timeline a `ScrollTrigger`. Its defaults are `top bottom`, `bottom top`, and `false` for scrub, pin, and markers. With motion disabled, it advances the supplied timeline to its final state without creating a trigger.
- `refreshOnLoad(root?)` waits for unsettled images and fonts, then refreshes `ScrollTrigger`. Its returned cleanup removes pending listeners and prevents a late refresh.

## Page lifecycle

`installPageMotionLifecycle(document)` initializes the current `[data-page-motion]` root immediately and after `astro:page-load`; it disposes before `astro:before-swap`. `initPageMotion(root)` owns the GSAP media-query context, initial refresh cleanup, and its `ResizeObserver`. Calling its cleanup more than once is safe.

Use transform and opacity only for entrances. The demo uses a short vertical reveal for the page introduction, cover, prose, and entry list. It does not enable pinning, horizontal scrolling, counters, cursor effects, or view transitions by default.

## Optional recipes

For a pinned or scrubbed section, make one timeline for the section, pass it through `scrollScene`, and keep the returned trigger inside the same `motionContext`. Revert the context and kill the trigger on the component lifecycle cleanup. Call `refreshOnLoad` again when new images or fonts can change that section’s height.

For a page that enables Astro view transitions, keep the existing `astro:page-load` and `astro:before-swap` lifecycle hooks. Never create triggers at module scope. Test an active animation while changing `prefers-reduced-motion`; the cleanup must restore final visible content and leave no trigger behind.

Keep `will-change` limited to elements carrying `data-reveal`, test interaction with links and forms during motion, and profile any added scene on a mid-range mobile emulation before shipping it.

Optional scenes require their own browser performance evidence at mobile and desktop sizes; the default entrance does not certify heavier choreography. Verify preference changes during motion, restored content with JavaScript disabled, links/forms while moving, and zero owned triggers after navigation cleanup. See [quality evidence](quality-report.md) for the tested baseline and outstanding manual/device checks.
