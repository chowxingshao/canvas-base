import { getCollection, type CollectionEntry } from 'astro:content';

export type CollectionName = 'pages' | 'posts' | 'projects';
export type ContentEntry = CollectionEntry<CollectionName>;

export function getEntryLocale(entry: ContentEntry): string {
  return entry.id.split('/')[0];
}

function compareStrings(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

export async function getPublishedEntries(
  collection: CollectionName,
): Promise<ContentEntry[]> {
  const entries = await getCollection(collection);
  return entries
    .filter(
      (entry) =>
        !entry.data.draft &&
        (collection !== 'pages' || entry.data.slug !== 'not-found'),
    )
    .sort((first, second) => {
      const firstDate =
        'publishedAt' in first.data ? first.data.publishedAt.getTime() : 0;
      const secondDate =
        'publishedAt' in second.data ? second.data.publishedAt.getTime() : 0;
      return (
        secondDate - firstDate ||
        compareStrings(first.data.slug, second.data.slug) ||
        compareStrings(first.id, second.id)
      );
    });
}
