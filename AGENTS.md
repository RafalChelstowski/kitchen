Implement ONE feature task from docs/progress.md.

IMPORTANT: If all items in docs/progress.md are marked [x], you MUST output <promise>RALPH_DOCS_PROGRESS_COMPLETE</promise> and stop. Do not do anything else.

## THIS ITERATION

1. Read `docs/progress.md`
2. If no `- [ ]` or `- [/]` items remain, output `<promise>RALPH_DOCS_PROGRESS_COMPLETE</promise>` and stop immediately
3. Pick the first `- [ ]` or `- [/]` item
4. Mark that item `[/]` before editing files
5. Inspect the relevant source, tests, and existing docs before changing code
6. Keep the change scoped to the selected checklist item and its acceptance criteria
7. Implement only that item.
8. Do not introduce new test frameworks, browser automation, or unrelated refactors for this feature-delivery loop
9. Run `corepack pnpm run typecheck` and any narrower command required by the selected acceptance criteria
10. If the selected item changes dependency manifests or lockfiles, run the needed `corepack pnpm` install command with the existing pnpm version
11. If the selected item changes tests or test mocks, run `corepack pnpm run test`
12. Mark the item `[x]` only when its acceptance criteria are satisfied
13. If verification exposes pre-existing or follow-up issues outside the selected item, record them under `## Findings` in `docs/progress.md`
14. Commit all changed files for the item together:
    `git add AGENTS.md docs/progress.md package.json pnpm-lock.yaml src docs .gitignore && git commit -m "feat: advance Rapier migration"`
15. End the iteration.

## SUCCESS = REQUIRED GATES PASS

The loop is complete only when every checklist item in `docs/progress.md` is marked `[x]`, the final verification item passes `corepack pnpm run typecheck`, `corepack pnpm run test`, and `corepack pnpm run build`, and no Cannon runtime leftovers remain in source or `package.json`.

## Project Context

- This is the `kitchen` React/Vite/Three project.
- Package manager is `pnpm@11.1.2`; prefer `corepack pnpm ...` commands.
- The target migration package is `@react-three/rapier@2.2.0`.
- The current app still uses `@react-three/cannon`; remove it incrementally only when checklist acceptance criteria say to.
- Preserve gameplay scope while migrating physics: player movement, pickups, throws, static bounds, window blocker behavior, mug/can interactions, and achievement unlock behavior should remain equivalent unless a checklist item explicitly allows a difference.
- `docs/physics-migration.md` is the existing Cannon inventory and must become the completed migration note before final verification.
- Do not add browser test infrastructure or new test frameworks in this feature-delivery loop.
- Do not treat generated build output as source. Keep generated `dist/` out of the final git status.
