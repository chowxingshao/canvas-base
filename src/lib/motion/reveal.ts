import { gsap } from 'gsap';
import { motionEnabled } from './environment.ts';
import { registerMotion } from './register.ts';

export type RevealOptions = {
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
};

type ResolvedRevealOptions = Required<RevealOptions>;

const defaults: ResolvedRevealOptions = {
  direction: 'up',
  distance: 24,
  duration: 0.5,
  delay: 0,
  ease: 'power2.out',
  stagger: 0,
};

function direction(
  value: string | undefined,
): RevealOptions['direction'] | undefined {
  return value === 'up' ||
    value === 'down' ||
    value === 'left' ||
    value === 'right' ||
    value === 'none'
    ? value
    : undefined;
}

function number(value: string | number | undefined, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function resolve(
  element: Element,
  options: RevealOptions,
): ResolvedRevealOptions {
  const dataset = element instanceof HTMLElement ? element.dataset : {};
  return {
    direction:
      options.direction ??
      direction(dataset.revealDirection) ??
      defaults.direction,
    distance: number(
      options.distance ?? dataset.revealDistance,
      defaults.distance,
    ),
    duration: number(
      options.duration ?? dataset.revealDuration,
      defaults.duration,
    ),
    delay: number(options.delay ?? dataset.revealDelay, defaults.delay),
    ease: options.ease ?? dataset.revealEase ?? defaults.ease,
    stagger: number(options.stagger ?? dataset.revealStagger, defaults.stagger),
  };
}

function startingPosition(options: ResolvedRevealOptions) {
  const distance = options.distance;
  switch (options.direction) {
    case 'down':
      return { x: 0, y: -distance };
    case 'left':
      return { x: -distance, y: 0 };
    case 'right':
      return { x: distance, y: 0 };
    default:
      return { x: 0, y: options.direction === 'up' ? distance : 0 };
  }
}

export function reveal(
  element: Element | Element[],
  options: RevealOptions = {},
): gsap.core.Tween | null {
  if (!motionEnabled()) return null;
  registerMotion();
  const first = Array.isArray(element) ? element[0] : element;
  if (!first) return null;
  const resolved = resolve(first, options);
  return gsap.fromTo(
    element,
    { autoAlpha: 0, ...startingPosition(resolved) },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: resolved.duration,
      delay: resolved.delay,
      ease: resolved.ease,
      stagger: resolved.stagger,
      overwrite: 'auto',
    },
  );
}
