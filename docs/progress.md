# Feature Delivery Progress

- [x] Move achievement hook out of src/api | AC: `useAchievement` lives under a local feature/store path, all imports use the new path, and `src/api/hooks/useAchievement.ts` no longer exists
- [x] Delete remaining local auth API stub | AC: `src/api/index.ts` is removed, no `userApi` symbol remains, and source search for `userApi|doSign|doPassword|auth` under `src` returns no app-code matches
- [x] Remove obsolete auth route constants | AC: `src/features/Nav.tsx` exports only active routes, and `/signup`, `/signin`, `/signout`, `/account`, and `/pw-forget` no longer appear in source
- [x] Derive achievement total from catalog | AC: Achievements page has no hard-coded `achievementTotal = 9`, denominator comes from `achievementCatalog`, and existing tests still pass
- [x] Remove Firebase cleanup residue | AC: `src/index.css` has no `.firebase-emulator-warning`, README no longer claims Firebase/account/global leaderboard support, and source/README search for `firebase|emulator|leaderboard` returns no stale matches
- [ ] Consolidate Tailwind 4 theme source | AC: custom `tViolet` and `tGreen` colors are defined in one place, redundant Tailwind config/theme duplication is removed, and `pnpm build` compiles existing classes
- [ ] Replace root non-null assertion in bootstrap | AC: `src/index.tsx` has no eslint disable or `container!`, missing root element throws an explicit error, and `pnpm typecheck` passes
- [ ] Remove unused legacy runtime dependencies | AC: unused packages found by source search are removed from `package.json`, including `easystarjs`, `leva`, `nanoid`, `pathfinding`, `react-transition-group`, and unused matching type packages
- [ ] Decide lint dependency shape | AC: package either has a working lint script using installed lint deps, or old unused ESLint/Prettier packages are removed; no dead lint-only packages remain
- [ ] Refresh lockfile after dependency cleanup | AC: `pnpm-lock.yaml` matches `package.json`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass
- [ ] Upgrade TypeScript and core type packages | AC: TypeScript and React/Node type packages are updated, `tsconfig.json` no longer needs Vite/Tailwind paths workarounds, and `pnpm typecheck` passes
- [ ] Modernize TypeScript compiler target | AC: `tsconfig.json` targets a modern browser/runtime level instead of `es5`, uses Vite-friendly module resolution, and `pnpm build` and `pnpm test` pass
- [ ] Update React 18 patch baseline | AC: `react` and `react-dom` are on the latest React 18 line, matching type packages are compatible, and the existing app smoke test passes
- [ ] Update React Testing Library baseline | AC: `@testing-library/react` is updated, current tests use supported APIs, and `pnpm test` passes without adding new tests
- [ ] Replace deep Three MathUtils imports | AC: source no longer imports from `three/src/math/MathUtils`, `degToRad` imports through public Three APIs, and `pnpm build` passes
- [ ] Add physics migration inventory | AC: `docs/physics-migration.md` lists every current `@react-three/cannon` usage by component, identifies each body shape/type, and notes whether it is static, dynamic, kinematic-like, or player-controlled
- [ ] Document Rapier migration constraints | AC: `docs/physics-migration.md` records target package `@react-three/rapier@2.2.0`, states that the Rapier migration is a separate pass, and lists current verification commands
- [ ] Remove Cannon version-update task from this pass | AC: `package.json` still uses the current Cannon package unless changed by another completed task, and no task in this pass attempts a partial Cannon upgrade
- [ ] Add build warning note for future 3D pass | AC: `docs/physics-migration.md` records the current `three-mesh-bvh`/`BatchedMesh` warning and large chunk warning as future 3D runtime follow-up items
- [ ] Final cleanup verification | AC: `pnpm typecheck` passes, `pnpm test` passes, `pnpm build` passes, and stale Firebase/auth matches are gone from app source

---

## Findings

(critical discoveries only)
