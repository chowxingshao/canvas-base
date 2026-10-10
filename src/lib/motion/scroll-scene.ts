import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionEnabled } from './environment.ts';
import { registerMotion } from './register.ts';

export type ScrollSceneOptions = {
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
};

export function scrollScene(
  element: Element,
  timeline: GSAPTimeline,
  options: ScrollSceneOptions = {},
): ScrollTrigger | null {
  timeline.pause();
  if (!motionEnabled()) {
    timeline.progress(1);
    return null;
  }
  registerMotion();
  return ScrollTrigger.create({
    trigger: element,
    animation: timeline,
    start: options.start ?? 'top bottom',
    end: options.end ?? 'bottom top',
    scrub: options.scrub ?? false,
    pin: options.pin ?? false,
    markers: options.markers ?? false,
  });
}
