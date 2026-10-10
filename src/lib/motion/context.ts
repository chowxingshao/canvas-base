import { gsap } from 'gsap';

export function motionContext(root: Element): gsap.Context {
  return gsap.context(() => undefined, root);
}
