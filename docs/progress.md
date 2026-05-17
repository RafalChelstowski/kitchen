# Feature: Kitchen Rapier Migration

- [x] Clean generated build output before migration | AC: untracked `dist/` is removed or ignored, `git status --short` shows no generated build output, no source files are changed by this task
- [x] Add Rapier and required React/Three stack versions | AC: `package.json` includes `@react-three/rapier@2.2.0`, `react`/`react-dom` are React 19 compatible, `@react-three/fiber` is 9.x compatible, `@react-three/drei` is 10.x compatible, `three` satisfies Rapier 2 peer range
- [x] Refresh lockfile after stack install | AC: `pnpm-lock.yaml` matches `package.json`, `pnpm typecheck` runs far enough to report source errors instead of missing packages, `@react-three/cannon` remains installed for incremental migration
- [x] Update app test mocks for the new stack while Cannon remains | AC: existing `App.test.tsx` still mocks active physics imports, no new test framework or browser test infrastructure is added, `pnpm test` passes
- [x] Replace Cannon Triplet type-only usage in non-body code | AC: `Letters.tsx` no longer imports from `@react-three/cannon`, local tuple type is used for animation positions, `pnpm typecheck` passes
- [x] Replace Cannon Triplet type aliases in body components | AC: body components use a local tuple type or Three-compatible tuple type, no component imports `Triplet` from `@react-three/cannon`, `pnpm typecheck` passes
- [x] Switch the root physics provider to Rapier | AC: `App.tsx` imports `Physics` from `@react-three/rapier`, dev debug uses Rapier `debug={import.meta.env.DEV}` or equivalent, Cannon `Debug` is removed from `App.tsx`, existing app smoke test passes
- [x] Migrate floor collider to Rapier | AC: `Floor.tsx` uses Rapier fixed rigid body/collider instead of `usePlane`, floor position and rotation match previous behavior, `pnpm typecheck` passes
- [x] Migrate static cube bounds to Rapier | AC: `CubeBoundary` uses Rapier fixed cuboid collision, GLTF-derived position/rotation/dimensions are preserved, cube boundary mesh names remain raycast-compatible for placement logic
- [x] Migrate static cylinder bounds to Rapier | AC: `CylinderBoundary` uses Rapier fixed cylinder collision, GLTF-derived position/radius/height are preserved, `StaticBounds` no longer imports Cannon hooks
- [x] Migrate window blocker to Rapier | AC: `InteractiveWindow` uses a Rapier fixed/kinematic collider instead of `useBox`, open state moves the blocker out of the window path, closed state restores the original blocker position
- [x] Migrate player body to Rapier | AC: `Player.tsx` uses a Rapier rigid body ref instead of `useBox`, pointer-lock movement still drives horizontal velocity, camera follows the body, rotations are locked/reset so the player does not tip over
- [x] Migrate Harnas can body to Rapier | AC: `Harnas.tsx` uses Rapier cylinder body/collider, hidden/picked/thrown states preserve position/velocity/rotation behavior, floor collision still unlocks `AchievementName.HARNAS`
- [x] Migrate Transform mug body to Rapier | AC: `Transform.tsx` uses Rapier cylinder body/collider, hidden/picked/animated/attached states preserve position/velocity/rotation behavior, ready-coffee reset collision behavior is preserved
- [x] Migrate Express grip body to Rapier | AC: `Express.tsx` uses Rapier cuboid body/collider, pickup/drop/attached/animated states preserve position/rotation/velocity behavior, coffee state transitions still typecheck
- [x] Migrate Mugs instanced bodies to Rapier | AC: `Mugs.tsx` uses Rapier instanced rigid bodies, initial grid placement is preserved, selected mug can still be positioned while picked and thrown with velocity
- [x] Migrate unmounted Rain instanced bodies to Rapier | AC: `Rain.tsx` no longer imports Cannon, falling can instances use Rapier instanced bodies or an equivalent Rapier-compatible implementation, component typechecks even though it is not mounted
- [x] Remove remaining Cannon imports from tests and source | AC: `rg "@react-three/cannon|useBox|useCylinder|usePlane|Triplet" src` returns no matches, app tests mock Rapier rather than Cannon, `pnpm test` passes
- [x] Remove Cannon dependency | AC: `@react-three/cannon` is removed from `package.json`, `pnpm-lock.yaml` is refreshed, `rg "@react-three/cannon" package.json pnpm-lock.yaml src` returns no active dependency/import matches
- [x] Update physics migration docs for completion | AC: `docs/physics-migration.md` states the project now uses `@react-three/rapier@2.2.0`, lists any behavior intentionally left equivalent rather than identical, removes obsolete instruction saying not to migrate in this pass
- [ ] Fix source compatibility from React 19 / R3F 9 / Three upgrade | AC: any type or API break caused by the stack upgrade is fixed without changing gameplay scope, `pnpm typecheck` passes
- [ ] Build the migrated app | AC: `pnpm build` passes, build no longer reports missing Cannon modules, any remaining Three/Rapier warnings are recorded under Findings
- [ ] Final verification for Rapier migration | AC: `pnpm typecheck` passes, `pnpm test` passes, `pnpm build` passes, `rg "@react-three/cannon|useBox|useCylinder|usePlane|Triplet" src package.json` returns no Cannon runtime leftovers

## Findings

- React 19/R3F 9 compile compatibility required a local global JSX bridge in `src/types/react-jsx-compat.d.ts`, updating legacy `planeBufferGeometry`/`boxBufferGeometry` JSX tags, and using `.js` suffixes for Three example imports under bundler module resolution.
- App smoke tests now mock the active Rapier `Physics`; Cannon `Physics`/`Debug` is no longer imported by `App.tsx`.
- `corepack pnpm run build` passes after the root Rapier provider switch, with Vite's existing large chunk warning for the bundled app chunk.
- Rapier player migration uses a dynamic `RigidBody` with a manual cuboid collider, `lockRotations`, `setLinvel` for pointer-lock movement, and `setAdditionalMass(0/3)` to preserve the previous unlocked/locked mass behavior.
- Rapier Harnas migration uses a dynamic `RigidBody` with a manual `CylinderCollider`; floor collision checks both `other.colliderObject` and `other.rigidBodyObject` ancestors for the existing `floor` mesh name before unlocking `AchievementName.HARNAS`.
- Rapier Transform migration uses a dynamic zero-mass `RigidBody`, manual `CylinderCollider`, `setAdditionalMass(0/1)` for attached/manual vs thrown physics, and resets ready coffee on low-height collision using the body's Rapier translation.
- Rapier Express migration uses a dynamic zero-mass `RigidBody`, manual `CuboidCollider`, `setAdditionalMass(0/3)` for attached/animated/picked vs dropped grip physics, and keeps coffee state transitions inside the existing click/spring flow.
- Rapier Mugs migration uses `InstancedRigidBodies` with manual `CuboidCollider` half extents `[0.05, 0.04, 0.05]`; selected instances are controlled through the rigid-body ref array for picked positioning and throw velocity.
- Rapier Rain migration uses `InstancedRigidBodies` with a manual `CylinderCollider` args `[0.09, 0.08]`; the timer still respawns random can instances above the scene by setting their rigid-body translation.
