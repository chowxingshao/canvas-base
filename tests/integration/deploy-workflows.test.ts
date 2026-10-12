import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// Reuse Astro's installed YAML parser without adding a runtime dependency.
const { parse } = createRequire(import.meta.resolve('astro'))('yaml') as {
  parse: (source: string) => Workflow;
};
type Step = {
  uses?: string;
  env?: Record<string, string>;
  with?: { script?: string; name?: string };
};
type Job = {
  if?: string;
  needs?: string;
  uses?: string;
  permissions?: Record<string, string>;
  steps?: Step[];
};
type Workflow = {
  on: Record<string, unknown>;
  jobs: Record<string, Job>;
  permissions: Record<string, string>;
};

async function workflow(provider: string) {
  return parse(
    (
      await readFile(
        new URL(
          `../../templates/deploy/${provider}.yml.template`,
          import.meta.url,
        ),
        'utf8',
      )
    ).replaceAll('{{BRANCH}}', 'release'),
  );
}

function enabled(
  job: Job,
  event: string,
  flag: string,
  head: string,
  result: string,
) {
  expect(job.if).toBeTypeOf('string');
  return runInNewContext(job.if!, {
    github: {
      event_name: event,
      repository: 'owner/site',
      event: { pull_request: { head: { repo: { full_name: head } } } },
    },
    vars: { ENABLE_PREVIEWS: flag },
    needs: { verify: { result } },
  });
}

describe.each(['netlify', 'vercel', 'cloudflare'])(
  '%s deployment workflow',
  (provider) => {
    it('permits previews only for enabled same-repository PRs after successful reusable CI', async () => {
      const generated = await workflow(provider);
      expect(generated.on).toHaveProperty('pull_request');
      expect(generated.on).not.toHaveProperty('pull_request_target');
      expect(generated.jobs.verify.uses).toBe('./.github/workflows/ci.yml');
      const preview = generated.jobs.preview;
      expect(preview).toBeDefined();
      expect(preview.needs).toBe('verify');
      for (const [event, flag, head, result, allowed] of [
        ['pull_request', 'true', 'owner/site', 'success', true],
        ['pull_request', 'false', 'owner/site', 'success', false],
        ['pull_request', '', 'owner/site', 'success', false],
        ['pull_request', 'true', 'fork/site', 'success', false],
        ['pull_request', 'true', 'owner/site', 'failure', false],
        ['pull_request', 'true', 'owner/site', 'cancelled', false],
        ['push', 'true', 'owner/site', 'success', false],
      ] as const)
        expect(enabled(preview, event, flag, head, result)).toBe(allowed);
      expect(
        enabled(
          generated.jobs.deploy,
          'pull_request',
          'true',
          'owner/site',
          'success',
        ),
      ).toBe(false);
      expect(
        enabled(generated.jobs.deploy, 'push', '', 'owner/site', 'success'),
      ).toBe(true);
      expect(generated.permissions).toEqual({ contents: 'read' });
      expect(preview.permissions).toEqual({
        contents: 'read',
        'pull-requests': 'write',
      });
      expect(
        preview.steps?.find((step) =>
          step.uses?.startsWith('actions/download-artifact@'),
        )?.with?.name,
      ).toBe(provider === 'vercel' ? 'site-vercel' : 'site-dist');
    });

    it.each([false, true])(
      'posts or updates the provider preview URL (existing comment: %s)',
      async (existing) => {
        const preview = (await workflow(provider)).jobs.preview;
        expect(preview).toBeDefined();
        const comment = preview.steps!.find((step) =>
          step.uses?.startsWith('actions/github-script@'),
        )!;
        expect(comment).toBeDefined();
        const requests: Array<{
          method: string;
          args: Record<string, unknown>;
        }> = [];
        const marker = `<!-- canvas-preview:${provider} -->`;
        const issues = {
          listComments: () => {},
          createComment: async (args: Record<string, unknown>) => {
            requests.push({ method: 'create', args });
          },
          updateComment: async (args: Record<string, unknown>) => {
            requests.push({ method: 'update', args });
          },
        };
        const context = {
          repo: { owner: 'owner', repo: 'site' },
          issue: { number: 42 },
        };
        const github = {
          rest: { issues },
          paginate: async () =>
            existing
              ? [
                  {
                    id: 7,
                    body: `${marker}\nOld preview`,
                    user: { type: 'Bot', login: 'github-actions[bot]' },
                  },
                ]
              : [],
        };
        const execute = new Function(
          'github',
          'context',
          'process',
          `return (async () => { ${comment.with!.script} })()`,
        );
        await execute(github, context, {
          env: { PREVIEW_URL: 'https://preview.example.com' },
        });
        expect(requests).toEqual([
          {
            method: existing ? 'update' : 'create',
            args: {
              ...context.repo,
              ...(existing ? { comment_id: 7 } : { issue_number: 42 }),
              body: `${marker}\nPreview: https://preview.example.com`,
            },
          },
        ]);
      },
    );
  },
);
