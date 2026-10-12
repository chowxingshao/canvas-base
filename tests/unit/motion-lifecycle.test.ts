import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

let dom: JSDOM;
let reducedMotion = false;
let mediaListener: ((event: MediaQueryListEvent) => void) | undefined;

function mockGsap() {
  const refresh = vi.fn();
  const registerPlugin = vi.fn();
  type Trigger = { kill: () => boolean };
  const activeTriggers = new Set<Trigger>();
  const create = vi.fn(() => {
    const trigger = {} as Trigger;
    trigger.kill = vi.fn(() => activeTriggers.delete(trigger));
    activeTriggers.add(trigger);
    return trigger;
  });
  const fromTo = vi.fn(() => ({ kill: vi.fn(), revert: vi.fn() }));
  const set = vi.fn();
  const context = vi.fn(() => ({ add: vi.fn(), revert: vi.fn() }));
  const matchMedia = vi.fn(() => ({ add: vi.fn(), revert: vi.fn() }));
  return {
    gsap: { registerPlugin, fromTo, set, context, matchMedia },
    ScrollTrigger: { create, refresh },
    activeTriggerCount: () => activeTriggers.size,
  };
}

async function loadMotion({ motion = true } = {}) {
  const mocked = mockGsap();
  vi.resetModules();
  vi.doMock('../../src/lib/config/site.ts', () => ({
    getSiteConfig: () => ({ features: { motion } }),
  }));
  vi.doMock('gsap', () => ({ gsap: mocked.gsap }));
  vi.doMock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: mocked.ScrollTrigger,
  }));
  return {
    ...(await import('../../src/lib/motion/environment.ts')),
    ...(await import('../../src/lib/motion/register.ts')),
    ...(await import('../../src/lib/motion/reveal.ts')),
    ...(await import('../../src/lib/motion/scroll-scene.ts')),
    ...(await import('../../src/lib/motion/refresh.ts')),
    ...(await import('../../src/scripts/page-motion.ts')),
    mocked,
  };
}

beforeEach(() => {
  dom = new JSDOM('', { url: 'https://local.example.test/' });
  for (const name of [
    'document',
    'window',
    'Element',
    'HTMLElement',
    'Event',
  ] as const)
    vi.stubGlobal(name, dom.window[name]);
  reducedMotion = false;
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      get matches() {
        return reducedMotion;
      },
      addEventListener: vi.fn(
        (_name: string, listener: (event: MediaQueryListEvent) => void) => {
          mediaListener = listener;
        },
      ),
      removeEventListener: vi.fn(),
    }),
  );
});

afterEach(() => {
  dom.window.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('motion lifecycle', () => {
  it('leaves content visible when reduced motion is requested', async () => {
    reducedMotion = true;
    const { reveal } = await loadMotion();
    const element = document.createElement('section');

    expect(reveal(element)).toBeNull();
    expect(element.style.opacity).not.toBe('0');
  });

  it('registers ScrollTrigger once only when browser motion is enabled', async () => {
    const { registerMotion, mocked } = await loadMotion();

    registerMotion();
    registerMotion();

    expect(mocked.gsap.registerPlugin).toHaveBeenCalledTimes(1);
  });

  it('uses explicit reveal options ahead of valid data attributes', async () => {
    const { reveal, mocked } = await loadMotion();
    const element = document.createElement('section');
    element.dataset.revealDirection = 'left';
    element.dataset.revealDistance = '48';

    reveal(element, { direction: 'right', distance: 12, duration: 0.4 });

    expect(mocked.gsap.fromTo).toHaveBeenCalledWith(
      element,
      { autoAlpha: 0, x: 12, y: 0 },
      expect.objectContaining({ duration: 0.4, x: 0, y: 0 }),
    );
  });

  it('falls back to standard timing when data attributes are negative or invalid', async () => {
    const { reveal, mocked } = await loadMotion();
    const element = document.createElement('section');
    element.dataset.revealDuration = '-1';
    element.dataset.revealDelay = 'not-a-number';
    element.dataset.revealStagger = '-2';

    reveal(element);

    expect(mocked.gsap.fromTo).toHaveBeenCalledWith(
      element,
      expect.any(Object),
      expect.objectContaining({ duration: 0.5, delay: 0, stagger: 0 }),
    );
  });

  it('completes a supplied paused timeline without a trigger when motion is disabled', async () => {
    const { scrollScene, mocked } = await loadMotion({ motion: false });
    const timeline = { pause: vi.fn(), progress: vi.fn() } as never;

    expect(scrollScene(document.createElement('section'), timeline)).toBeNull();
    expect(
      (timeline as { progress: ReturnType<typeof vi.fn> }).progress,
    ).toHaveBeenCalledWith(1);
    expect(mocked.ScrollTrigger.create).not.toHaveBeenCalled();
  });

  it('refreshes after failed images once fonts settle and never after disposal', async () => {
    let resolveFonts!: () => void;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: new Promise<void>((resolve) => (resolveFonts = resolve)),
      },
    });
    const { refreshOnLoad, mocked } = await loadMotion();
    const root = document.createElement('main');
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', {
      configurable: true,
      value: false,
    });
    root.append(image);
    const dispose = refreshOnLoad(root);

    image.dispatchEvent(new Event('error'));
    await Promise.resolve();
    expect(mocked.ScrollTrigger.refresh).not.toHaveBeenCalled();
    resolveFonts();
    await Promise.resolve();
    expect(mocked.ScrollTrigger.refresh).toHaveBeenCalledTimes(1);

    dispose();
    await Promise.resolve();
    expect(mocked.ScrollTrigger.refresh).toHaveBeenCalledTimes(1);
  });

  it('reverts managed motion when preference changes and on repeated page teardown', async () => {
    const { initPageMotion, mocked } = await loadMotion();
    const root = document.createElement('main');
    root.innerHTML = '<section data-reveal><h1>Visible content</h1></section>';
    const dispose = initPageMotion(root);

    reducedMotion = true;
    mediaListener?.({ matches: true } as MediaQueryListEvent);
    expect(root.querySelector('section')?.style.opacity).not.toBe('0');

    dispose();
    dispose();
    expect(mocked.activeTriggerCount()).toBe(0);
  });

  it('reinitializes only the current page across navigation lifecycle events', async () => {
    const { installPageMotionLifecycle } = await loadMotion();
    document.body.innerHTML =
      '<main data-page-motion><section data-reveal>One</section></main>';
    const dispose = installPageMotionLifecycle(document);

    document.dispatchEvent(new Event('astro:page-load'));
    document.dispatchEvent(new Event('astro:page-load'));
    document.dispatchEvent(new Event('astro:before-swap'));
    document.body.innerHTML =
      '<main data-page-motion><section data-reveal>Two</section></main>';
    document.dispatchEvent(new Event('astro:page-load'));
    dispose();
    dispose();

    expect(document.querySelector('[data-page-motion]')?.textContent).toContain(
      'Two',
    );
  });
});
