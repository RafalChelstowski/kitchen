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
8. This modernization loop intentionally avoids new test creation and new test infrastructure. Do not add new tests. Update existing tests only if a modernization task breaks them and the task acceptance criteria requires existing tests to pass.
9. Run the verification required by the item's acceptance criteria. Use `pnpm typecheck`, `pnpm test`, and `pnpm build` where the item names them. For source-search acceptance criteria, use `rg` when available, otherwise use `grep -R --exclude-dir=node_modules`.
10. If required commands fail, fix the task and rerun step 9 until the acceptance criteria and required checks pass
11. Generated caches, build noise, and tool artifacts do not count as task progress. Do not mark `[x]` or commit if only unrelated/generated files changed.
12. Mark the item `[x]` only when its acceptance criteria are satisfied
13. Add brief notes to `## Findings` only when they reduce future loop risk
14. Commit all changed files for the item together:
    `git add -A && git commit -m "chore: <item-name>"`
15. End the iteration. Output `<promise>RALPH_DOCS_PROGRESS_COMPLETE</promise>` only when step 2 triggered

## SUCCESS = REQUIRED GATES PASS

- Required checks named in the current item's acceptance criteria
- Keep existing `pnpm typecheck`, `pnpm test`, and `pnpm build` gates passing when a task names them
- Final verification task: `pnpm typecheck`, `pnpm test`, and `pnpm build`

## Project Context

- This is the Kitchen React/Three.js app on Vite, pnpm, Tailwind 4 Vite integration, local-only achievements, Zustand persistence, and Vitest.
- The loop goal is a pure modernization cleanup pass after the initial Vite/Firebase removal work.
- App entry is `src/index.tsx`; the Vite root HTML is `index.html`.
- Existing tests live in `src/App.test.tsx`, `src/setupTests.ts`, `src/store/store.test.ts`, and `src/api/hooks/useAchievement.test.ts`.
- Do not create new tests or new test infrastructure in this pass.
- Achievement UI and catalog live under `src/features/user/`; store state and actions live in `src/store/store.ts` and `src/types/store/store.ts`.
- The achievement hook currently lives in `src/api/hooks/useAchievement.ts`; move it to a feature/store-local path and update imports.
- Remaining auth/API cleanup residue includes `src/api/index.ts`, obsolete route constants in `src/features/Nav.tsx`, Firebase README copy, and the `.firebase-emulator-warning` CSS rule.
- Tailwind colors `tViolet` and `tGreen` are currently duplicated between `tailwind.config.js` and `src/index.css`.
- Current TypeScript configuration still targets `es5` and includes Vite/Tailwind path workarounds that should become unnecessary after package updates.
- Preserve 3D app behavior. The Rapier migration is documentation-only in this pass; do not upgrade or partially migrate Cannon.
- Physics inventory should document current `@react-three/cannon` use without changing physics behavior.
- Do not start a dev server. Avoid browser/manual smoke checks unless a checklist item explicitly requires one.
