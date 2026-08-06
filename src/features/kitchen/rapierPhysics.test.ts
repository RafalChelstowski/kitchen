// @vitest-environment node

import RAPIER from '@dimforge/rapier3d-compat';

const RAPIER_VERSION = '0.19.3';
const GRAVITY = { x: 0, y: -2, z: 0 };
const FLOOR_Y = -4.5;
const FLOOR_HALF_HEIGHT = 0.05;
const DYNAMIC_HALF_HEIGHT = 0.04;
const TOTAL_STEPS = 180;
const FALLING_STEPS = 30;
const TIME_STEP = 1 / 60;

beforeAll(async () => {
  await RAPIER.init();
});

test('applies kitchen gravity and resolves a dynamic collider against the floor', () => {
  let world: RAPIER.World | undefined;

  try {
    world = new RAPIER.World(GRAVITY);
    world.timestep = TIME_STEP;

    const floorBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        0,
        FLOOR_Y - FLOOR_HALF_HEIGHT,
        0
      )
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(50, FLOOR_HALF_HEIGHT, 50)
        .setFriction(0.85)
        .setRestitution(0.05),
      floorBody
    );

    const dynamicBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(0, -3.5, 0)
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.05, DYNAMIC_HALF_HEIGHT, 0.05),
      dynamicBody
    );

    const initialY = dynamicBody.translation().y;

    for (let step = 0; step < FALLING_STEPS; step += 1) {
      world.step();
    }

    expect(dynamicBody.translation().y).toBeLessThan(initialY);
    expect(dynamicBody.linvel().y).toBeLessThan(0);

    let lowestY = dynamicBody.translation().y;
    for (let step = FALLING_STEPS; step < TOTAL_STEPS; step += 1) {
      world.step();
      lowestY = Math.min(lowestY, dynamicBody.translation().y);
    }

    const floorSurfaceY = FLOOR_Y;
    const expectedRestingY = floorSurfaceY + DYNAMIC_HALF_HEIGHT;

    expect(lowestY).toBeGreaterThanOrEqual(expectedRestingY - 0.02);
    expect(dynamicBody.translation().y).toBeCloseTo(expectedRestingY, 2);
    expect(dynamicBody.linvel().y).toBeCloseTo(0, 2);
    expect(RAPIER.version()).toBe(RAPIER_VERSION);
  } finally {
    world?.free();
  }
});
