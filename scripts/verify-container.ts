const containerOrigin = 'http://localhost:8080';
const base = process.argv[2] ?? '/';
const mountedBase = base === '/' ? '/' : `/${base.replace(/^\/+|\/+$/g, '')}/`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function request(path: string, headers: HeadersInit = {}) {
  return fetch(new URL(path, containerOrigin), { headers, redirect: 'manual' });
}

async function verify(): Promise<void> {
  const home = await request(mountedBase, { 'accept-encoding': 'gzip' });
  assert(
    home.status === 200,
    `Expected ${mountedBase} to return 200, received ${home.status}.`,
  );
  assert(
    home.headers.get('cache-control') === 'no-cache',
    'HTML must use no-cache.',
  );
  assert(
    home.headers.get('content-security-policy')?.includes("object-src 'none'"),
    'HTML is missing the CSP.',
  );
  assert(
    home.headers.get('x-content-type-options') === 'nosniff',
    'HTML is missing nosniff.',
  );
  assert(
    home.headers.get('content-encoding') === 'gzip',
    'HTML did not use gzip.',
  );

  const html = await home.text();
  const asset = html.match(
    new RegExp(
      `${mountedBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_astro/[^"']+`,
    ),
  )?.[0];
  assert(asset, 'Home page did not reference a hashed Astro asset.');
  const staticAsset = await request(asset!);
  assert(staticAsset.status === 200, `Expected ${asset} to return 200.`);
  assert(
    staticAsset.headers.get('cache-control') ===
      'public, max-age=31536000, immutable',
    'Hashed assets must be immutable.',
  );
  assert(
    staticAsset.headers.get('content-security-policy'),
    'Assets are missing security headers.',
  );

  const missing = await request(`${mountedBase}missing-route/`);
  assert(
    missing.status === 404,
    `Expected an unknown URL to return 404, received ${missing.status}.`,
  );
  assert(
    (await missing.text()).includes('<h1'),
    'The 404 response did not contain the static error page.',
  );
}

verify()
  .then(() =>
    console.log(
      `Container verification passed for ${containerOrigin}${mountedBase}.`,
    ),
  )
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
