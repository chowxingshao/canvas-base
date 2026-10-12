import { describe, expect, it } from 'vitest';

import {
  baseEntrySchema,
  pageStructuredDataSchema,
  publicationDateSchema,
} from '../../src/lib/content/schemas.ts';

const valid = {
  title: 'About',
  description: 'About us',
  slug: 'about',
  draft: false,
};

describe('content frontmatter', () => {
  it('requires an explicit draft boolean', () => {
    expect(
      baseEntrySchema.safeParse({
        title: 'About',
        description: 'About us',
        slug: 'about',
      }).success,
    ).toBe(false);
    expect(
      baseEntrySchema.safeParse({ ...valid, draft: 'false' }).success,
    ).toBe(false);
    expect(baseEntrySchema.parse(valid).draft).toBe(false);
  });

  it.each(['title', 'description'] as const)(
    'requires nonempty %s for SEO',
    (field) => {
      expect(
        baseEntrySchema.safeParse({ ...valid, [field]: undefined }).success,
      ).toBe(false);
      expect(
        baseEntrySchema.safeParse({ ...valid, [field]: '  ' }).success,
      ).toBe(false);
    },
  );

  it.each([
    '',
    'About',
    '../about',
    'about/us',
    'about_us',
    'about--us',
    'about-',
    '-about',
  ])('rejects unsafe slug %j', (slug) => {
    expect(baseEntrySchema.safeParse({ ...valid, slug }).success).toBe(false);
  });

  it('preserves a stable frontmatter slug', () => {
    expect(baseEntrySchema.parse({ ...valid, slug: 'about-us' }).slug).toBe(
      'about-us',
    );
  });

  it('validates the page structured-data discriminator and public URLs', () => {
    expect(
      pageStructuredDataSchema.parse({
        type: 'Person',
        name: 'Example author',
        jobTitle: 'Designer',
        url: 'https://example.com',
        sameAs: ['https://example.com/profile'],
      }).type,
    ).toBe('Person');
    expect(
      pageStructuredDataSchema.parse({
        type: 'Organization',
        name: 'Example organization',
      }).type,
    ).toBe('Organization');
    expect(
      pageStructuredDataSchema.parse({
        type: 'LocalBusiness',
        name: 'Example business',
        address: 'Example address',
        telephone: '+60 000 0000',
      }).type,
    ).toBe('LocalBusiness');
    expect(
      pageStructuredDataSchema.safeParse({ type: 'Store', name: 'Example' })
        .success,
    ).toBe(false);
    expect(
      pageStructuredDataSchema.safeParse({
        type: 'Person',
        name: 'Example',
        url: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
    expect(
      pageStructuredDataSchema.safeParse({
        type: 'Organization',
        name: 'Example',
        sameAs: ['ftp://example.com'],
      }).success,
    ).toBe(false);
  });
});

describe('ISO publication dates', () => {
  it.each([
    ['2026-10-08', '2026-10-08T00:00:00.000Z'],
    ['2024-02-29', '2024-02-29T00:00:00.000Z'],
    ['2026-10-08T12:30+08:00', '2026-10-08T04:30:00.000Z'],
    ['2026-10-08T12:30:45Z', '2026-10-08T12:30:45.000Z'],
    ['2026-10-08T12:30:45.123+08:00', '2026-10-08T04:30:45.123Z'],
    ['2026-10-08T12:30:45-04:00', '2026-10-08T16:30:45.000Z'],
  ])('parses %s as a Date', (input, expected) => {
    expect(publicationDateSchema.parse(input).toISOString()).toBe(expected);
  });

  it.each([
    '2026-02-30',
    '2025-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-10-00',
    '08/10/2026',
    '2026-10-08T12:30:45',
    '2026-02-30T12:00:00Z',
    '2026-10-08T24:00:00Z',
    '2026-10-08T12:60:00Z',
    '2026-10-08T12:30:60Z',
    '2026-10-08T12:30:00+24:00',
    '',
    null,
    new Date(),
  ])('rejects an invalid or ambiguous date %j', (input) => {
    expect(publicationDateSchema.safeParse(input).success).toBe(false);
  });
});
