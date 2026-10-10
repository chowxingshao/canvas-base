import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { configureProject } from '../../scripts/configure-project-lib.ts';
import { withFeatures } from '../helpers/config.ts';

const roots: string[] = [];
afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'Client Sites Test One-'));
  roots.push(root);
  await mkdir(join(root, 'templates', 'deploy'), { recursive: true });
  await mkdir(join(root, 'src', 'content'), { recursive: true });
  await writeFile(join(root, 'brief.template.md'), '# Project brief\n');
  await writeFile(
    join(root, 'src', 'content', 'ui.json'),
    '{"nav":{"home":"Home"}}\n',
  );
  await writeFile(
    join(root, 'templates', 'deploy', 'netlify.yml.template'),
    'name: Netlify\n',
  );
  return root;
}

describe('configureProject', () => {
  it('keeps an authored brief and remains a no-op for default configuration', async () => {
    const root = await fixture();
    await writeFile(join(root, 'brief.md'), '# Authored brief\n');

    const first = await configureProject({ root, config: withFeatures({}) });
    const second = await configureProject({ root, config: withFeatures({}) });

    expect(await readFile(join(root, 'brief.md'), 'utf8')).toBe(
      '# Authored brief\n',
    );
    expect(first.created).toEqual([]);
    expect(second).toEqual({ created: [], updated: [], removed: [] });
  });

  it('owns an unchanged deployment workflow but rejects a modified one before writes', async () => {
    const root = await fixture();
    const netlify = withFeatures({ deploy: 'netlify' });
    await configureProject({ root, config: netlify });
    const workflow = join(root, '.github', 'workflows', 'deploy.yml');
    expect(await readFile(workflow, 'utf8')).toBe('name: Netlify\n');

    await writeFile(workflow, 'name: Authored workflow\n');
    await expect(
      configureProject({ root, config: withFeatures({ deploy: 'none' }) }),
    ).rejects.toThrow(/deploy\.yml/);
    expect(await readFile(workflow, 'utf8')).toBe('name: Authored workflow\n');
  });

  it('creates and safely removes only its locale dictionaries', async () => {
    const root = await fixture();
    const enabled = withFeatures({ i18n: true });
    const config = {
      ...enabled,
      i18n: { defaultLocale: 'en', locales: ['en', 'ms'] },
    };
    await configureProject({ root, config });
    const ms = join(root, 'src', 'i18n', 'ms.json');
    expect(JSON.parse(await readFile(ms, 'utf8'))).toEqual({
      nav: { home: 'Home' },
    });

    await writeFile(ms, '{"nav":{"home":"Utama"}}\n');
    await expect(
      configureProject({ root, config: withFeatures({ i18n: false }) }),
    ).rejects.toThrow(/ms\.json/);
    expect(await readFile(ms, 'utf8')).toContain('Utama');
  });
});
