import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionEnabled } from './environment.ts';

let registered = false;

export function registerMotion(): void {
  if (registered || !motionEnabled()) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}
