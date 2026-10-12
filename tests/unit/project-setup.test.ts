import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  symlink,
  writeFile,
} from 'node:fs/promises';
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
  it.runIf(process.platform === 'win32')(
    'rejects a manifest path on another drive before writes',
    async () => {
      const root = await fixture();
      await mkdir(join(root, '.canvas'));
      await writeFile(
        join(root, '.canvas', 'generated.json'),
        JSON.stringify({ files: { 'Z:/escape.txt': 'a'.repeat(64) } }),
      );
      await expect(
        configureProject({ root, config: withFeatures({}) }),
      ).rejects.toThrow(/escapes project root/);
      await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    },
  );

  it.each(['existing', 'dangling'])(
    'rejects a %s manifest-file junction before writes',
    async (kind) => {
      const root = await fixture();
      const outside = await fixture();
      await mkdir(join(root, '.canvas'));
      await symlink(
        kind === 'existing' ? outside : join(outside, 'missing'),
        join(root, '.canvas', 'generated.json'),
        'junction',
      );
      await expect(
        configureProject({ root, config: withFeatures({}) }),
      ).rejects.toThrow(/symbolic link/);
      await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    },
  );

  it('rejects a late non-directory ancestor before creating a brief', async () => {
    const root = await fixture();
    await writeFile(join(root, '.github'), 'client data');
    await expect(
      configureProject({ root, config: withFeatures({ deploy: 'netlify' }) }),
    ).rejects.toThrow(/non-directory ancestor/);
    await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(await readFile(join(root, '.github'), 'utf8')).toBe('client data');
  });

  it('rejects a manifest directory collision before creating a brief', async () => {
    const root = await fixture();
    await mkdir(join(root, '.canvas', 'generated.json'), { recursive: true });
    await expect(
      configureProject({ root, config: withFeatures({}) }),
    ).rejects.toThrow(/not a regular file/);
    await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('rejects an unowned workflow without creating the brief or manifest', async () => {
    const root = await fixture();
    await mkdir(join(root, '.github', 'workflows'), { recursive: true });
    const workflow = join(root, '.github', 'workflows', 'deploy.yml');
    await writeFile(workflow, 'name: Client workflow\n');
    await expect(
      configureProject({ root, config: withFeatures({ deploy: 'netlify' }) }),
    ).rejects.toThrow(/unowned.*deploy\.yml/i);
    expect(await readFile(workflow, 'utf8')).toBe('name: Client workflow\n');
    await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(lstat(join(root, '.canvas'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it.each(['existing', 'dangling'])(
    'rejects a %s manifest-directory junction before writes',
    async (kind) => {
      const root = await fixture();
      const outside = await fixture();
      const target = kind === 'existing' ? outside : join(outside, 'missing');
      await symlink(target, join(root, '.canvas'), 'junction');
      await expect(
        configureProject({ root, config: withFeatures({}) }),
      ).rejects.toThrow(/symbolic link/);
      await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await expect(
        lstat(join(outside, 'generated.json')),
      ).rejects.toMatchObject({ code: 'ENOENT' });
    },
  );

  it('preflights a later deployment junction before creating an earlier brief', async () => {
    const root = await fixture();
    const outside = await fixture();
    await symlink(outside, join(root, '.github'), 'junction');
    await expect(
      configureProject({ root, config: withFeatures({ deploy: 'netlify' }) }),
    ).rejects.toThrow(/symbolic link/);
    await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(lstat(join(outside, 'workflows'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('preflights a later deployment junction before removing owned dictionaries', async () => {
    const root = await fixture();
    await configureProject({ root, config: withFeatures({ i18n: true }) });
    const dictionary = join(root, 'src', 'i18n', 'en.json');
    const before = await readFile(dictionary, 'utf8');
    const manifest = await readFile(
      join(root, '.canvas', 'generated.json'),
      'utf8',
    );
    const outside = await fixture();
    await symlink(outside, join(root, '.github'), 'junction');
    await expect(
      configureProject({ root, config: withFeatures({ deploy: 'netlify' }) }),
    ).rejects.toThrow(/symbolic link/);
    expect(await readFile(dictionary, 'utf8')).toBe(before);
    expect(
      await readFile(join(root, '.canvas', 'generated.json'), 'utf8'),
    ).toBe(manifest);
  });

  it('rejects a dangling dictionary junction before creating files', async () => {
    const root = await fixture();
    const outside = await fixture();
    await symlink(
      join(outside, 'missing'),
      join(root, 'src', 'i18n'),
      'junction',
    );
    await expect(
      configureProject({ root, config: withFeatures({ i18n: true }) }),
    ).rejects.toThrow(/symbolic link/);
    await expect(lstat(join(root, 'brief.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

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
