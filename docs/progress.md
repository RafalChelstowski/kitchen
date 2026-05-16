# Feature Delivery Progress

- [x] Add Vite app scaffold files | AC: `vite.config.ts` exists, root `index.html` exists, `index.html` loads `/src/index.tsx`
- [x] Convert CRA HTML placeholders to Vite paths | AC: `index.html` contains no `%PUBLIC_URL%`, favicon/apple-touch/manifest links point to public-root paths, `public/index.html` is removed
- [x] Replace CRA env usage | AC: source code contains no `process.env`, dev checks use `import.meta.env.DEV`
- [x] Replace CRA type reference | AC: `src/react-app-env.d.ts` is removed or renamed to Vite-compatible env typing, source typecheck does not depend on `react-scripts`
- [x] Update package scripts for pnpm/Vite | AC: scripts include `dev`, `build`, `typecheck`, `test`, no scripts call `craco`, `react-scripts`, `yarn`, or Firebase emulators
- [x] Add pnpm package manager metadata | AC: `package.json` has `packageManager: pnpm@11.1.2`, `pnpm-lock.yaml` exists, `yarn.lock` is removed
- [x] Remove CRA/Craco runtime dependencies | AC: package dependencies no longer include `react-scripts`, `@craco/craco`, `worker-plugin`, or `worker-loader`
- [x] Remove unused worker placeholder | AC: `src/raycast.worker.ts` is removed if unused, no source import references `react-hooks-worker`
- [x] Remove obsolete web-vitals reporting | AC: `src/reportWebVitals.ts` is removed, `web-vitals` is removed from dependencies, no source imports `reportWebVitals`
- [x] Install Tailwind 4 Vite integration | AC: package dependencies include `tailwindcss@4.3.0` and `@tailwindcss/vite@4.3.0`, old `@tailwindcss/postcss7-compat` alias is gone
- [ ] Wire Tailwind through Vite | AC: `vite.config.ts` uses the Tailwind Vite plugin, `craco.config.js` no longer exists, `pnpm build` compiles CSS
- [ ] Preserve existing Tailwind app styles | AC: `src/index.css` still defines existing base/components styles, rendered class names used by Nav/Menu/Settings/Achievements remain present in source
- [ ] Remove React Query bootstrap | AC: `src/index.tsx` no longer imports `react-query`, `QueryClientProvider`, or `ReactQueryDevtools`, app renders without provider wrapping
- [ ] Remove React Query context bridge | AC: `src/App.tsx` no longer checks `window.ReactQueryClientContext`, no `useContextBridge` import remains
- [ ] Delete Firebase config files | AC: `firebase.json` is removed, package scripts no longer reference Firebase emulators, package dependencies no longer include `firebase` or `firebase-admin`
- [ ] Delete Firebase API modules | AC: Firebase app/auth/database/analytics files are removed or empty-unused, no source imports from `src/api/firebase`, `src/api/database`, `src/api/user`, or `src/api/analytics`
- [ ] Delete React Query API hooks | AC: `useSnapshot`, `useSet`, `useUpdate`, `useRemove`, and `useRealtimeQuery` are removed or unused, no source imports them
- [ ] Add local achievement catalog module | AC: catalog contains exactly 9 entries keyed by `AchievementName`, each entry has `fullName` and `description`, catalog contains no player dates
- [ ] Add Fridge achievement catalog entry | AC: `FRIDGE` maps to `Fridge door`, description is `If you don't like what you've found inside - maybe throw it outside?`
- [ ] Add letter achievement catalog entries | AC: `AT`, `BO`, `CU`, and `DK` map to `Letter T/O/U/K`, descriptions are `Ultra rare piece 1/4` through `Ultra rare piece 4/4`
- [ ] Add remaining achievement catalog entries | AC: `COFFEE`, `WINDOW`, `NEON`, and `HARNAS` have the agreed full names and descriptions
- [ ] Upgrade Zustand store API | AC: store imports use current Zustand API shape, TypeScript accepts store creation, existing selectors compile
- [ ] Add Zustand persistence middleware | AC: store uses `persist`, storage key is stable, persisted state includes achievements, gfxSettings, and pointerSpeed
- [ ] Exclude transient state from persistence | AC: persistence partialization excludes coffeeState, letters, playerStatus, and isLocked
- [ ] Add achievement viewed action | AC: store exposes an action that changes one achievement status to `VIEWED`, action preserves original date
- [ ] Convert achievement unlocking to local-only | AC: `useAchievement` no longer reads auth/user/mutation state, duplicate unlocks return without mutation, new unlocks update Zustand and show success toast
- [ ] Simplify achievements player list | AC: Achievements page reads descriptions from local catalog, player achievements render without Firebase data, collected count denominator is 9
- [ ] Remove global achievements mode | AC: global leaderboard component/path is removed, Achievements page has no local/global toggle, no code reads all users
- [ ] Make viewed status local | AC: hovering or viewing a NEW achievement marks it `VIEWED` through Zustand only, no query refetch or remote update remains
- [ ] Remove auth-dependent nav states | AC: Nav no longer imports `useUser` or `userApi`, nav links are limited to Home, Settings, and Achievements
- [ ] Remove auth routes from user menu | AC: UserMenus no longer routes sign in, sign up, sign out, account, or password reset pages
- [ ] Delete account and password components | AC: sign-in, sign-up, sign-out, account, password change, password reset, and sign-out button components are removed or unused
- [ ] Remove user type exports tied to Firebase | AC: Firebase user/api type files are removed or unused, no source import references Firebase types
- [ ] Remove React Query dependency | AC: `react-query` is absent from `package.json`, no source import references `react-query`
- [ ] Remove Firebase-related dev dependencies | AC: `cypress-firebase`, `firebase-admin`, and unused Cypress Firebase tooling are absent from `package.json`
- [ ] Replace Jest with Vitest config | AC: Vitest config exists, `jest.config.js` is removed, test script runs Vitest
- [ ] Make test setup Vitest-compatible | AC: `src/setupTests.ts` imports jest-dom through Vitest-compatible setup, TypeScript recognizes test globals
- [ ] Fix existing app smoke test | AC: `src/App.test.tsx` runs under Vitest/RTL, test does not depend on Firebase or React Query providers
- [ ] Add store persistence unit test | AC: test verifies persisted partial state includes achievements/preferences and excludes transient state
- [ ] Add achievement unlock unit test | AC: test verifies first unlock adds payload with NEW, second unlock for same achievement does not overwrite existing payload
- [ ] Add achievement viewed unit test | AC: test verifies marking viewed changes status to VIEWED and keeps the original date
- [ ] Final dependency cleanup | AC: `package.json` contains no unused modernization leftovers identified by source search, removed packages have no remaining imports
- [ ] Final verification pass | AC: `pnpm typecheck` passes, `pnpm test` passes, `pnpm build` passes

---

## Findings

(critical discoveries only)
- 2026-05-16: `pnpm` is not on PATH; `COREPACK_HOME=/tmp/corepack-cache HOME=/tmp PNPM_HOME=/tmp/pnpm-home npm_config_store_dir=/tmp/pnpm-store corepack pnpm typecheck` reaches install but pnpm 11 blocks on ignored dependency build scripts. Direct `./node_modules/.bin/tsc --noEmit` currently fails on pre-existing `src/api/database.ts` generic `Object` typing and `src/types/common/navigator.ts` XR interface mismatch.
