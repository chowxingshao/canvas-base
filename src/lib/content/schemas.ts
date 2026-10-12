import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

const nonempty = z.string().trim().min(1);
export const entrySlugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use a lowercase, hyphen-separated one-segment slug.',
  );
export const entryLocaleSchema = z
  .string()
  .regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);

export const baseEntrySchema = z.object({
  title: nonempty,
  description: nonempty,
  slug: entrySlugSchema,
  draft: z.boolean(),
  coverAlt: nonempty.optional(),
});

function isIsoPublicationDate(value: string): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/.exec(
      value,
    );
  if (!match) return false;
  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    zone,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) return false;
  if (hourText !== undefined) {
    if (
      Number(hourText) > 23 ||
      Number(minuteText) > 59 ||
      Number(secondText ?? 0) > 59
    )
      return false;
    if (
      zone !== 'Z' &&
      (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)
    )
      return false;
  }
  return Number.isFinite(Date.parse(value));
}

export const publicationDateSchema = z
  .string()
  .refine(
    isIsoPublicationDate,
    'Use a valid ISO date or datetime with Z or an explicit timezone offset.',
  )
  .transform((value) => new Date(value));

const publicUrl = z.string().refine((value) => {
  if (!/^https?:\/\//.test(value) || /[\\\s]/.test(value)) return false;
  try {
    const url = new URL(value);
    return Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'Use a public HTTP(S) URL.');
const identity = {
  name: nonempty,
  url: publicUrl.optional(),
  sameAs: z.array(publicUrl).optional(),
};
export const pageStructuredDataSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('Person'),
    ...identity,
    jobTitle: nonempty.optional(),
  }),
  z.strictObject({ type: z.literal('Organization'), ...identity }),
  z.strictObject({
    type: z.literal('LocalBusiness'),
    ...identity,
    address: nonempty.optional(),
    telephone: nonempty.optional(),
  }),
]);
export type PageStructuredData = z.infer<typeof pageStructuredDataSchema>;

function requireCoverAlt(
  data: { cover?: unknown; coverAlt?: string },
  context: z.RefinementCtx,
) {
  if (data.cover && !data.coverAlt) {
    context.addIssue({
      code: 'custom',
      path: ['coverAlt'],
      message: 'A cover requires descriptive coverAlt text.',
    });
  }
}

export function createPageSchema(image: SchemaContext['image']) {
  return baseEntrySchema
    .extend({
      cover: image().optional(),
      structuredData: pageStructuredDataSchema.optional(),
    })
    .superRefine(requireCoverAlt);
}

export function createPublicationSchema(image: SchemaContext['image']) {
  return baseEntrySchema
    .extend({ publishedAt: publicationDateSchema, cover: image().optional() })
    .superRefine(requireCoverAlt);
}
