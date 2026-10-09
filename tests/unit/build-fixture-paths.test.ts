import { describe, expect, it } from 'vitest';
import { resolveFixturePath } from '../helpers/build.ts';

// These tests perform no filesystem operations and never create a dependency link.
const windowsRoot = String.raw`C:\fixture`;
const protectedRoots = [
  '.git',
  '.astro',
  '.superpowers',
  '.worktrees',
  'node_modules',
  'dist',
  'coverage',
];
const caseVariants = [
  '.GIT',
  '.GiT',
  '.ASTRO',
  '.AsTrO',
  '.SUPERPOWERS',
  '.SuperPowers',
  '.WORKTREES',
  '.WorkTrees',
  'NODE_MODULES',
  'Node_Modules',
  'DIST',
  'DiSt',
  'COVERAGE',
  'CoVeRaGe',
];

describe('isolated fixture path validation', () => {
  it.each(protectedRoots)(
    'rejects canonical protected Windows root %s',
    (directory) => {
      expect(() =>
        resolveFixturePath(windowsRoot, `${directory}/example.txt`, 'win32'),
      ).toThrow('Fixture paths must remain inside the temporary project.');
    },
  );

  it.each(caseVariants)(
    'rejects case variant of a protected Windows root %s',
    (directory) => {
      expect(() =>
        resolveFixturePath(windowsRoot, `${directory}/example.txt`, 'win32'),
      ).toThrow('Fixture paths must remain inside the temporary project.');
    },
  );

  it.each([
    '../escape.txt',
    String.raw`..\escape.txt`,
    String.raw`D:\escape.txt`,
  ])('rejects a Windows path outside the fixture %s', (path) => {
    expect(() => resolveFixturePath(windowsRoot, path, 'win32')).toThrow();
  });

  it('resolves a permitted Windows source path', () => {
    expect(
      resolveFixturePath(windowsRoot, 'src/content/posts/en/safe.md', 'win32'),
    ).toBe(String.raw`C:\fixture\src\content\posts\en\safe.md`);
  });

  it('retains case-sensitive POSIX directory behavior', () => {
    expect(
      resolveFixturePath('/fixture', 'NODE_MODULES/example.txt', 'linux'),
    ).toBe('/fixture/NODE_MODULES/example.txt');
    expect(() =>
      resolveFixturePath('/fixture', 'node_modules/example.txt', 'linux'),
    ).toThrow();
    expect(() =>
      resolveFixturePath('/fixture', '../escape.txt', 'linux'),
    ).toThrow();
  });
});
