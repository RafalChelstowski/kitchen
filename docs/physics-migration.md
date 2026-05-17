# Physics Migration Notes

The project now uses `@react-three/rapier@2.2.0` for runtime physics. The
previous `@react-three/cannon` dependency and source imports have been removed.

## Runtime Setup

- `src/App.tsx` wraps the scene in Rapier `Physics` with gravity
  `[0, -2, 0]`.
- Development physics debug rendering is provided through Rapier's `debug`
  prop, alongside the existing Drei `Stats` view.
- `src/App.test.tsx` mocks Rapier `Physics` so the smoke test still verifies
  React rendering without loading the real physics world.

## Migrated Bodies

| Component | Rapier implementation | Preserved role |
| --- | --- | --- |
| `src/features/player/Player.tsx` | Dynamic `RigidBody` with manual cuboid collider, locked rotations, and direct linear velocity updates. | Pointer-lock movement drives horizontal velocity, the camera follows the body, and unlock resets velocity/rotation/mass behavior. |
| `src/features/kitchen/Floor.tsx` | Fixed rigid body/collider. | Floor position and flat rotation match the previous scene collider. |
| `src/features/kitchen/Bounds.tsx` `CubeBoundary` | Fixed cuboid collision built from GLTF mesh bounds. | Static cube bounds keep GLTF-derived transform and mesh names for raycast placement logic. |
| `src/features/kitchen/Bounds.tsx` `CylinderBoundary` | Fixed cylinder collision built from GLTF mesh bounds. | Static cylinder bounds keep GLTF-derived position, radius, and height. |
| `src/features/kitchen/Mugs.tsx` | `InstancedRigidBodies` with manual cuboid colliders. | Initial mug grid placement, selected-mug positioning while picked, and throw velocity are preserved. |
| `src/features/kitchen/interactive/Express.tsx` | Dynamic zero-mass `RigidBody` with manual cuboid collider. | Pickup, drop, attached, animated, position, rotation, velocity, and coffee state transitions remain in the existing click/spring flow. |
| `src/features/kitchen/interactive/Harnas.tsx` | Dynamic `RigidBody` with manual cylinder collider. | Hidden, picked, thrown, position, velocity, and rotation behavior remain equivalent; floor contact still unlocks `AchievementName.HARNAS`. |
| `src/features/kitchen/interactive/Transform.tsx` | Dynamic zero-mass `RigidBody` with manual cylinder collider. | Hidden, picked, animated, attached, thrown, and reset behavior remain equivalent, including ready-coffee reset on low-height collision. |
| `src/features/kitchen/interactive/Window.tsx` | Fixed/kinematic Rapier blocker collider. | Closed state restores the original blocker position; open state moves it out of the window path. |
| `src/features/harnasie/Rain.tsx` | `InstancedRigidBodies` with manual cylinder colliders. | Falling can instances and timer-based respawn above the scene are preserved, even though the component is not mounted. |

## Intentional Equivalence Notes

- Several previously mass-driven interactions now use Rapier rigid-body APIs
  such as `setAdditionalMass`, `setLinvel`, and direct translation/rotation
  updates. The goal is gameplay equivalence rather than identical internal
  physics integration.
- Picked or animated objects remain controlled by camera/spring state and are
  released back to dynamic physics only when the existing gameplay flow does so.
- Harnas floor collision checks both collider and rigid-body object ancestors
  for the existing `floor` mesh name before unlocking the achievement, matching
  the previous gameplay outcome while using Rapier event shapes.
- Mug and rain colliders are manually sized to match the prior practical
  collision volumes rather than deriving every detail from rendered geometry.
- The large Vite app chunk warning remains a performance follow-up and is not a
  physics migration behavior change.

## Verification

Required final migration gates:

- `corepack pnpm run typecheck`
- `corepack pnpm run test`
- `corepack pnpm run build`
- No active `@react-three/cannon` runtime dependency or source imports remain.
