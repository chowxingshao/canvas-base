import { existsSync, statSync } from 'node:fs';
import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import {
  createPageSchema,
  createPublicationSchema,
  entryLocaleSchema,
  entrySlugSchema,
} from './lib/content/schemas.ts';

function localizedGlob(collection: string): Loader {
  return {
    name: `localized-${collection}-glob`,
    async load(context) {
      const identities = new Map<string, URL>();
      const fileIdentities = new Map<string, string>();
      const loader = glob({
        pattern: '**/*.{md,mdx}',
        base: `./src/content/${collection}/`,
        generateId({ entry, base, data }) {
          const segments = entry.replaceAll('\\', '/').split('/');
          if (segments.length !== 2)
            throw new Error(
              `Store ${collection} entries directly under a locale directory: ${entry}`,
            );
          const locale = entryLocaleSchema.parse(segments[0]);
          const slug = entrySlugSchema.parse(data.slug);
          const id = `${locale}/${slug}`;
          const file = new URL(
            encodeURI(entry).replace(/[#?]/g, encodeURIComponent),
            base,
          );
          // Astro defers image imports until a collection consumer is bundled.
          // Check local files here so unused entries still fail on broken covers.
          if (typeof data.cover === 'string') {
            const cover = new URL(data.cover, file);
            if (
              cover.protocol === 'file:' &&
              (!existsSync(cover) || !statSync(cover).isFile())
            ) {
              throw new Error(
                `Missing cover file "${data.cover}" for ${collection}/${id}`,
              );
            }
          }
          const previousId = fileIdentities.get(file.href);
          if (previousId && previousId !== id) identities.delete(previousId);
          const previousFile = identities.get(id);
          if (
            previousFile &&
            previousFile.href !== file.href &&
            existsSync(previousFile)
          ) {
            throw new Error(
              `Duplicate ${collection} locale/slug key "${id}": ${previousFile.href} and ${file.href}`,
            );
          }
          identities.set(id, file);
          fileIdentities.set(file.href, id);
          return id;
        },
      });
      await loader.load(context);
    },
  };
}

export const collections = {
  pages: defineCollection({
    loader: localizedGlob('pages'),
    schema: ({ image }) => createPageSchema(image),
  }),
  posts: defineCollection({
    loader: localizedGlob('posts'),
    schema: ({ image }) => createPublicationSchema(image),
  }),
  projects: defineCollection({
    loader: localizedGlob('projects'),
    schema: ({ image }) => createPublicationSchema(image),
  }),
};
