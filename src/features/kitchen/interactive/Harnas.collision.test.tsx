import * as THREE from 'three';
import { toast } from 'react-toastify';

import {
  createGltfFixture,
  createMockRapierBody,
  createRapierMocks,
  createUseGltfMock,
  render3D,
} from '../../../test';
import { getState, initialState, setState } from '../../../store/store';
import { AchievementName } from '../../../types';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const fixture = createGltfFixture({
  geometry: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  nodes: [{ name: 'Cylinder' }],
  materials: {
    harnasblue: new THREE.MeshStandardMaterial({ color: 'blue' }),
  },
});
let bodyProps: Record<string, unknown> | undefined;
let body = createMockRapierBody();
const rapierMocks = createRapierMocks({
  bodyFactory: (props) => {
    bodyProps = props;
    return body;
  },
});

vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({
    '/can_uv.gltf': fixture,
  }),
}));
vi.doMock('@react-three/rapier', () => rapierMocks);

interface CollisionOther {
  colliderObject?: THREE.Object3D;
  rigidBodyObject?: THREE.Object3D;
}

type CollisionHandler = (event: { other: CollisionOther }) => void;

let HarnasComponent!: typeof import('./Harnas').Harnas;

beforeAll(async () => {
  ({ Harnas: HarnasComponent } = await import('./Harnas'));
});

beforeEach(() => {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
    playerStatus: null,
  });
  body = createMockRapierBody();
  bodyProps = undefined;
  rapierMocks.bodies.length = 0;
  rapierMocks.colliders.length = 0;
  rapierMocks.physics.length = 0;
  vi.clearAllMocks();
});

function createNamedObject(name: string): THREE.Object3D {
  const object = new THREE.Object3D();
  object.name = name;
  return object;
}

function createObjectWithNamedAncestor(
  ancestorName: string,
  objectName: string
): { ancestor: THREE.Group; object: THREE.Object3D } {
  const ancestor = new THREE.Group();
  ancestor.name = ancestorName;
  const object = createNamedObject(objectName);
  ancestor.add(object);

  return { ancestor, object };
}

function getCollisionHandler(): CollisionHandler {
  const handler = rapierMocks.colliders[0]?.props.onCollisionEnter;

  expect(handler).toEqual(expect.any(Function));
  return handler as CollisionHandler;
}

function triggerCollision(
  handler: CollisionHandler,
  other: CollisionOther
): void {
  handler({ other });
}

test('configures the dynamic can body and unlocks HARNAS only on floor contact', async () => {
  const renderer = await render3D(<HarnasComponent />);

  try {
    expect(bodyProps).toMatchObject({
      angularDamping: 2.5,
      canSleep: true,
      colliders: false,
      linearDamping: 0.45,
      mass: 0.35,
      type: 'dynamic',
    });
    expect(rapierMocks.colliders).toHaveLength(1);
    expect(rapierMocks.colliders[0]).toMatchObject({
      kind: 'Cylinder',
      props: {
        args: [0.07, 0.06],
        friction: 0.9,
        restitution: 0.12,
      },
    });

    const handler = getCollisionHandler();
    const counter = createObjectWithNamedAncestor(
      'counter_rigid_body',
      'counter_collider'
    );
    triggerCollision(handler, {
      colliderObject: counter.object,
      rigidBodyObject: counter.ancestor,
    });

    expect(getState().achievements[AchievementName.HARNAS]).toBeUndefined();
    expect(toast.success).not.toHaveBeenCalled();

    const directFloor = createNamedObject('floor');
    triggerCollision(handler, { colliderObject: directFloor });

    const firstAchievement = getState().achievements[AchievementName.HARNAS];
    expect(firstAchievement).toBeDefined();
    expect(toast.success).toHaveBeenCalledOnce();

    const floorCollider = createObjectWithNamedAncestor(
      'floor',
      'floor_collider_shape'
    );
    triggerCollision(handler, {
      colliderObject: floorCollider.object,
      rigidBodyObject: createNamedObject('counter_rigid_body'),
    });

    const floorRigidBody = createObjectWithNamedAncestor(
      'floor',
      'floor_rigid_body_object'
    );
    triggerCollision(handler, {
      colliderObject: createNamedObject('counter_collider_shape'),
      rigidBodyObject: floorRigidBody.object,
    });

    expect(getState().achievements[AchievementName.HARNAS]).toBe(
      firstAchievement
    );
    expect(toast.success).toHaveBeenCalledOnce();
  } finally {
    await renderer.unmount();
  }
});
