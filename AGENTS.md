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
8. This modernization loop intentionally migrates package manager, build tooling, auth/storage, and tests. Do not add tests outside the explicit checklist items.
9. Run the verification required by the item's acceptance criteria. Before pnpm scripts exist, use the smallest relevant local check available. Once pnpm scripts exist, prefer `pnpm typecheck`, `pnpm test`, and `pnpm build` as applicable, and run all three for the final verification task.
10. If required commands fail, fix the task and rerun step 9 until the acceptance criteria and required checks pass
11. Generated caches, build noise, and tool artifacts do not count as task progress. Do not mark `[x]` or commit if only unrelated/generated files changed.
12. Mark the item `[x]` only when its acceptance criteria are satisfied
13. Add brief notes to `## Findings` only when they reduce future loop risk
14. Commit all changed files for the item together:
    `git add -A && git commit -m "chore: <item-name>"`
15. End the iteration. Output `<promise>RALPH_DOCS_PROGRESS_COMPLETE</promise>` only when step 2 triggered

## SUCCESS = REQUIRED GATES PASS

- Required checks named in the current item's acceptance criteria
- After pnpm migration is available: `pnpm typecheck`, `pnpm test`, and `pnpm build` where applicable
- Final verification task: `pnpm typecheck`, `pnpm test`, and `pnpm build`

## Project Context

- This is the Kitchen React/Three.js app, currently on a CRA/Craco/Firebase/Yarn stack.
- The loop goal is an initial modernization pass: Vite, pnpm, Tailwind 4 Vite integration, local-only achievements, Zustand persistence, and Vitest.
- App entry is currently `src/index.tsx`; CRA public HTML currently lives at `public/index.html`.
- The app contains existing tests: `src/App.test.tsx` and `src/setupTests.ts`.
- Existing Firebase and React Query code lives under `src/api/`, `src/features/user/`, and related type files. Remove only when no source imports remain.
- Existing achievements UI lives in `src/features/user/Achievements.tsx`; store state and actions live in `src/store/store.ts` and `src/types/store/store.ts`.
- Preserve 3D app behavior and existing Tailwind class usage while changing build tooling.
- Do not start a dev server. Avoid browser/manual smoke checks unless a checklist item explicitly requires one.
