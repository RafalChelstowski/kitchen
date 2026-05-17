# Physics Migration Inventory

This file records the current `@react-three/cannon` usage before any Rapier
migration work. It is an inventory only; physics behavior remains unchanged in
this pass.

## Rapier Migration Constraints

- Target package for the future migration: `@react-three/rapier@2.2.0`.
- The Rapier migration is a separate implementation pass. This modernization
  pass must not upgrade, remove, or partially replace the current
  `@react-three/cannon` runtime behavior.
- Current verification commands for this pass: `pnpm typecheck`, `pnpm test`,
  and `pnpm build`.

## Future 3D Runtime Follow-Ups

- `pnpm build` currently reports `[IMPORT_IS_UNDEFINED]` because
  `three-mesh-bvh` reads `THREE.BatchedMesh`, but the installed `three` package
  does not export `BatchedMesh`. Treat this as a future Three/Drei/BVH
  dependency-alignment task; do not change physics behavior in this
  modernization pass.
- `pnpm build` currently reports the Vite large chunk warning after minification.
  The generated app chunk is about 1.7 MB before gzip. Treat chunk splitting or
  lazy-loading of heavy 3D runtime code as a separate performance follow-up.

## Runtime Setup

| Component | Cannon usage | Current role |
| --- | --- | --- |
| `src/App.tsx` | `Physics` with `gravity={[0, -2, 0]}` | Creates the Cannon physics world for the scene. |
| `src/App.tsx` | `Debug` in development builds | Wraps physics children with debug rendering and Drei `Stats`. |

## Bodies

| Component | Cannon usage | Body shape/type | Motion role |
| --- | --- | --- | --- |
| `src/features/player/Player.tsx` | `useBox<Mesh>` | Box body, `args: [0.05, 1.2, 0.05]`, `type: 'Dynamic'`, starts with `mass: 0` | Player-controlled. Pointer-lock movement sets velocity each frame, switches mass to `3` while locked, and resets velocity/rotation/mass when unlocked. |
| `src/features/kitchen/Floor.tsx` | `usePlane<Mesh>` | Plane body, `type: 'Static'`, rotated flat at `y = -4.5` | Static floor collider. |
| `src/features/kitchen/Bounds.tsx` `CubeBoundary` | `useBox<THREE.Mesh>` | Box body from GLTF mesh bounds, `type: 'Static'` | Static environment collider for meshes whose names include `Cube`. |
| `src/features/kitchen/Bounds.tsx` `CylinderBoundary` | `useCylinder<THREE.Mesh>` | Cylinder body from GLTF mesh bounds, `args: [radius, radius, height, 16]`, `type: 'Static'` | Static environment collider for meshes whose names include `Cylinder`. |
| `src/features/kitchen/Mugs.tsx` | `useBox<InstancedMesh>` | Instanced box bodies, `args: [0.1, 0.08, 0.1]`, `type: 'Dynamic'`, `mass: 20` | Dynamic props. When a mug is picked, code drives its position/velocity/rotation from the camera, so the selected instance behaves kinematic-like and player-controlled until placed or thrown. |
| `src/features/kitchen/interactive/Express.tsx` | `useBox<THREE.Group>` | Box body, `args: [0.1, 0.1, 0.2]`, `type: 'Dynamic'`, `mass: 0` | Kinematic-like espresso grip. Animation and pickup states drive position/rotation directly; dropped placement can set mass to `3`; attached/animated states set mass back to `0`. |
| `src/features/kitchen/interactive/Harnas.tsx` | `useCylinder<Mesh>` | Cylinder body, `args: [0.06, 0.06, 0.14, 12]`, dynamic by mass, `mass: 1` | Dynamic can prop with player-controlled pickup/throw behavior. Hidden and picked states drive position/velocity directly; floor collision unlocks the Harnas achievement. |
| `src/features/kitchen/interactive/Transform.tsx` | `useCylinder<THREE.Group>` | Cylinder body, `args: [0.05, 0.05, 0.1, 12]`, dynamic by mass, `mass: 1` | Kinematic-like transform mug. Hidden, picked, animated, and attached states drive position/rotation/velocity directly and often set mass to `0`; thrown/dropped states restore mass to `1`. |
| `src/features/kitchen/interactive/Window.tsx` | `useBox<Mesh>` | Box body from `nodes.window_bound` dimensions, `type: 'Static'` | Static window collider that is repositioned upward when the window opens and restored when it closes. |
| `src/features/harnasie/Rain.tsx` | `useCylinder<InstancedMesh>` | Instanced cylinder bodies, `args: [0.08, 0.08, 0.18, 5]`, dynamic by mass, `mass: 1` | Dynamic falling can bodies. A frame timer respawns random instances above the scene by setting their positions. The component is not currently mounted by `App.tsx`. |

## Type-Only Usage

| Component | Cannon usage | Notes |
| --- | --- | --- |
| `src/features/kitchen/interactive/Letters.tsx` | `Triplet` import | Uses Cannon's tuple type for spring animation positions; no Cannon body is created. |
| `src/features/kitchen/Bounds.tsx`, `src/features/kitchen/Mugs.tsx`, `src/features/kitchen/interactive/Express.tsx`, `src/features/kitchen/interactive/Transform.tsx`, `src/features/player/Player.tsx` | `Triplet` import | Uses Cannon's tuple type for positions, dimensions, or rotations alongside runtime body hooks. |

## Test Harness

| File | Cannon usage | Notes |
| --- | --- | --- |
| `src/App.test.tsx` | Mocks `Physics` and `Debug` from `@react-three/cannon` | Keeps the app smoke test focused on React rendering without loading the real physics world. |
