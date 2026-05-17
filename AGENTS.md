Implement ONE feature task from docs/progress.md.

IMPORTANT: If all items in docs/progress.md are marked [x], you MUST output <promise>RALPH_DOCS_PROGRESS_COMPLETE</promise> and stop. Do not do anything else.

## THIS ITERATION

1. Read `docs/progress.md`
2. If no `- [ ]` or `- [/]` items remain, output `<promise>RALPH_DOCS_PROGRESS_COMPLETE</promise>` and stop immediately
3. Pick the first `- [ ]` or `- [/]` item
4. Read `## Findings` in `docs/progress.md` and reuse relevant discoveries
5. Parse the item:
   - Task description: everything before `|`
   - Acceptance criteria: everything after `AC:`
6. Determine mode:
   - `[ ]` -> CREATE: implement from scratch
   - `[/]` -> IMPROVE: read existing code, read Findings for this item, fix or enhance
7. Implement only that item. If you uncover adjacent work, add a new `[ ]` item instead of widening scope. When removing or refactoring code, preserve existing safety checks unless the AC explicitly asks to remove them.
8. This repo has existing tests. Do not add new test frameworks or test infrastructure; run existing tests only when the selected acceptance criteria require them
9. Run `corepack pnpm run typecheck`
10. If required commands fail, fix the task and rerun step 9 until the acceptance criteria and required checks pass
11. Generated caches, build noise, and tool artifacts do not count as task progress. Do not mark `[x]` or commit if only unrelated/generated files changed.
12. Mark the item `[x]` only when its acceptance criteria are satisfied
13. Add brief notes to `## Findings` only when they reduce future loop risk
14. Commit all changed files for the item together:
    `git add -A && git commit -m "chore: <item-name>"`
15. End the iteration. Output `<promise>RALPH_DOCS_PROGRESS_COMPLETE</promise>` only when step 2 triggered

## SUCCESS = REQUIRED GATES PASS

- `corepack pnpm run typecheck`
- `corepack pnpm run test`
- `corepack pnpm run build`

## Project Context

- This is the `kitchen` React/Vite/Three project.
- Package manager is `pnpm@11.1.2`; prefer `corepack pnpm ...` commands.
- The target migration package is `@react-three/rapier@2.2.0`.
- The current app still uses `@react-three/cannon`; remove it incrementally only when checklist acceptance criteria say to.
- Preserve gameplay scope while migrating physics: player movement, pickups, throws, static bounds, window blocker behavior, mug/can interactions, and achievement unlock behavior should remain equivalent unless a checklist item explicitly allows a difference.
- `docs/physics-migration.md` is the existing Cannon inventory and must become the completed migration note before final verification.
- Do not add browser test infrastructure or new test frameworks in this feature-delivery loop.
- Do not treat generated build output as source. Keep generated `dist/` out of the final git status.
