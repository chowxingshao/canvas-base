import { getRouteManifest } from '../../lib/routing/manifest.ts';

export const prerender = true;
export async function GET(): Promise<Response> {
  const records = (await getRouteManifest()).map(
    ({ path, canonicalPath, fallback, alternates }) => ({
      path,
      canonicalPath,
      fallback,
      alternates,
    }),
  );
  return Response.json(records);
}
