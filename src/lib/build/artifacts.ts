import { createHash } from 'node:crypto';
import {
  cp,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { SiteConfig } from '../config/schema.ts';
import { feedEnabled } from '../seo/feed.ts';

function sha256(value: string): string {
  return `'sha256-${createHash('sha256').update(value).digest('base64')}'`;
}

async function inlineHashes(
  directory: string,
): Promise<{ scripts: string[]; styles: string[] }> {
  const scripts = new Set<string>();
  const styles = new Set<string>();
  async function visit(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = await readFile(path, 'utf8');
        for (const match of html.matchAll(
          /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi,
        ))
          if (match[1].trim()) scripts.add(sha256(match[1]));
        for (const match of html.matchAll(
          /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi,
        ))
          if (match[1].trim()) styles.add(sha256(match[1]));
      }
    }
  }
  await visit(directory);
  return { scripts: [...scripts].sort(), styles: [...styles].sort() };
}

export function buildSecurityHeaders(
  config: SiteConfig,
  inlineScriptHashes: string[],
  inlineStyleHashes: string[],
): Record<string, string> {
  const formAction = config.formEndpoint
    ? new URL(config.formEndpoint).origin
    : "'none'";
  const directive = (name: string, sources: string[]) =>
    `${name} ${sources.join(' ')}`;
  return {
    'Content-Security-Policy': [
      "default-src 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      `form-action ${formAction}`,
      directive('script-src', ["'self'", ...inlineScriptHashes]),
      // GSAP writes transform and opacity through element style attributes.
      directive('style-src', [
        "'self'",
        "'unsafe-inline'",
        ...inlineStyleHashes,
      ]),
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'none'",
    ].join('; '),
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

function nginxHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => `add_header ${name} "${value}" always;`)
    .join('\n');
}

function nginxLocations(base: string): string {
  const root = base === '/' ? '/' : base;
  const notFound = `${root}404.html`;
  const fallback =
    base === '/'
      ? ''
      : `
location / {
  include /etc/nginx/includes/headers.conf;
  add_header Cache-Control "no-cache" always;
  try_files $uri $uri.html =404;
}`;
  return `error_page 404 ${notFound};

location = ${notFound} {
  include /etc/nginx/includes/headers.conf;
  add_header Cache-Control "no-cache" always;
}

location ^~ ${root}_astro/ {
  include /etc/nginx/includes/headers.conf;
  add_header Cache-Control "public, max-age=31536000, immutable" always;
  try_files $uri =404;
}

location ${root} {
  include /etc/nginx/includes/headers.conf;
  add_header Cache-Control "no-cache" always;
  try_files $uri $uri/ $uri.html =404;
}${fallback}
`;
}

async function writeNginxArtifacts(
  outputDir: URL,
  config: SiteConfig,
): Promise<void> {
  const output = fileURLToPath(outputDir);
  const generated = join(dirname(output), '.generated', 'nginx');
  const html = join(generated, 'html');
  const baseDirectory = config.base === '/' ? html : join(html, config.base);
  await rm(generated, { recursive: true, force: true });
  await mkdir(baseDirectory, { recursive: true });
  await cp(output, baseDirectory, { recursive: true });
  const hashes = await inlineHashes(output);
  await writeFile(
    join(generated, 'headers.conf'),
    `${nginxHeaders(buildSecurityHeaders(config, hashes.scripts, hashes.styles))}\n`,
  );
  await writeFile(
    join(generated, 'locations.conf'),
    nginxLocations(config.base),
  );
}

export async function finalizeArtifacts(
  outputDir: URL,
  config: SiteConfig,
): Promise<void> {
  try {
    await copyFile(
      new URL('sitemap-index.xml', outputDir),
      new URL('sitemap.xml', outputDir),
    );
    if (!feedEnabled(config))
      await rm(new URL('rss.xml', outputDir), { force: true });
  } finally {
    await rm(new URL('__build/routes.json', outputDir), { force: true });
    // Never recursively delete an unexpected directory or other build data.
    await rmdir(new URL('__build/', outputDir));
  }
  await writeNginxArtifacts(outputDir, config);
}

export function createArtifactIntegration(
  config: SiteConfig,
): AstroIntegration {
  return {
    name: 'canvas:finalize-artifacts',
    hooks: {
      'astro:build:done': async ({ dir }) => finalizeArtifacts(dir, config),
    },
  };
}
