import { describe, expect, it } from 'vitest';

describe('motion environment', () => {
  it('keeps the environment helper importable during SSR and disables motion', async () => {
    const { motionEnabled } =
      await import('../../src/lib/motion/environment.ts');

    expect(motionEnabled()).toBe(false);
  });
});
