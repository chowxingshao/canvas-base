import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  motionContext,
  motionEnabled,
  refreshOnLoad,
  registerMotion,
  reveal,
} from '../lib/motion/index.ts';

type ResizeObserverLike = {
  disconnect(): void;
  observe(target: Element): void;
};

export function initPageMotion(root: Element): () => void {
  let disposed = false;
  let context = motionContext(root);
  let media = gsap.matchMedia();
  let frame: number | undefined;
  let refreshing = false;
  const refreshCleanup = refreshOnLoad(root);
  const preference = globalThis.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  );

  const queueRefresh = () => {
    if (disposed || refreshing || frame !== undefined || !motionEnabled())
      return;
    const run = () => {
      frame = undefined;
      if (disposed || !motionEnabled()) return;
      refreshing = true;
      ScrollTrigger.refresh();
      queueMicrotask(() => {
        refreshing = false;
      });
    };
    frame = globalThis.requestAnimationFrame
      ? globalThis.requestAnimationFrame(run)
      : (globalThis.setTimeout(run, 0) as unknown as number);
  };

  const addReveals = () => {
    if (!motionEnabled()) return;
    registerMotion();
    context.add(() => {
      const elements = Array.from(root.querySelectorAll('[data-reveal]'));
      if (elements.length) reveal(elements);
    });
  };

  const addMediaContext = () => {
    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        addReveals();
        return () => context.revert();
      },
      root,
    );
  };

  addMediaContext();
  const observer: ResizeObserverLike | undefined = globalThis.ResizeObserver
    ? new globalThis.ResizeObserver(() => queueRefresh())
    : undefined;
  observer?.observe(root);

  const onPreferenceChange = (event: MediaQueryListEvent) => {
    if (disposed || !event.matches) return;
    context.revert();
  };
  preference?.addEventListener('change', onPreferenceChange);

  return () => {
    if (disposed) return;
    disposed = true;
    preference?.removeEventListener('change', onPreferenceChange);
    observer?.disconnect();
    refreshCleanup();
    if (frame !== undefined) {
      if (globalThis.cancelAnimationFrame)
        globalThis.cancelAnimationFrame(frame);
      else globalThis.clearTimeout(frame);
    }
    media.revert();
    context.revert();
    media = gsap.matchMedia();
    context = motionContext(root);
  };
}

export function installPageMotionLifecycle(root: Document): () => void {
  let disposePage: () => void = () => undefined;
  let disposed = false;
  const initialize = () => {
    disposePage();
    const page = root.querySelector<HTMLElement>('[data-page-motion]');
    disposePage = page ? initPageMotion(page) : () => undefined;
  };
  const dispose = () => {
    disposePage();
    disposePage = () => undefined;
  };
  root.addEventListener('astro:page-load', initialize);
  root.addEventListener('astro:before-swap', dispose);
  initialize();
  return () => {
    if (disposed) return;
    disposed = true;
    dispose();
    root.removeEventListener('astro:page-load', initialize);
    root.removeEventListener('astro:before-swap', dispose);
  };
}
