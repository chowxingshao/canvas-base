/** Serialize data before inserting it into an inline script, never raw config text. */
export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined)
    throw new TypeError('JSON-LD must be serializable JSON.');
  return serialized
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
