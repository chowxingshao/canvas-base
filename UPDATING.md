# Updating a copy from Canvas Base

This applies to projects **started from the template** (via GitHub's "Use this
template" button or a tool like `degit`). Such copies have no shared Git history
with Canvas Base, so upstream improvements are pulled in manually. A GitHub
**fork** keeps shared history and syncs more easily, but ties the copy to
upstream and is intended for contributing changes back, not for client work.

Marking the repository as a template (Settings → **Template repository**) only
adds the "Use this template" button. It does not change how copies receive
updates.

## Two layers

Canvas Base separates a **fixed infrastructure layer** (toolchain, validation,
build helpers, CI, template documentation) from a **variable presentation
layer** (pages, layouts, components, CSS, imagery, motion, and content). Upstream
updates almost always change the infrastructure layer; client edits almost always
change the presentation layer. Keeping the two separate is what makes manual
updates tractable.

## Add the upstream remote once

In the client copy:

```sh
git remote add upstream https://github.com/chowxingshao/canvas-base.git
```

## Pull upstream changes

```sh
git fetch upstream
git merge upstream/main --allow-unrelated-histories
```

`--allow-unrelated-histories` is required only on the first merge, because the
copy and the template do not share history. Later merges omit it.

To review changes before merging, inspect `git log upstream/main` or
`git diff main..upstream/main` first. To take only a specific fix, cherry-pick it
with `git cherry-pick <commit>` instead of merging the whole branch.

## Resolving conflicts

Conflicts cluster in the presentation layer the client replaced. Keep the client
version for:

- `site.config.ts` and `brief.md`
- `design-direction.md`
- `src/content/` (UI copy, pages, posts, projects)
- client pages, layouts, components, CSS, and imagery

Take the upstream version for infrastructure the client did not intentionally
change: build and lint configuration, `src/lib/`, test harness, CI workflows, and
template documentation. Review each conflict rather than resolving in bulk.

## After updating

Run the standard gates before relying on the result:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm test
pnpm build
```

Resolve any new lint or type errors introduced by the merge, and re-review
presentation against the brief.
