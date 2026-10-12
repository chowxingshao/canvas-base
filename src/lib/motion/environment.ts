import { getSiteConfig } from '../config/site.ts';

function browserAvailable(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function motionEnabled(): boolean {
  if (!browserAvailable() || !getSiteConfig().features.motion) return false;
  return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
