import type { ContentEntry } from '../content/entries.ts';
export type RouteRecord = {
  kind: 'page' | 'post' | 'project' | 'post-index' | 'project-index';
  slug: string;
  path: string;
  locale: string;
  contentLocale: string;
  fallback: boolean;
  entry?: ContentEntry;
  canonicalPath: string;
  alternates: Array<{ locale: string; path: string }>;
};
