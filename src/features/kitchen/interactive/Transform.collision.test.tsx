import * as THREE from 'three';

import {
  createGltfFixture,
  createMockRapierBody,
  createRapierMocks,
  createUseGltfMock,
  render3D,
  type MockRapierBody,
  type R3FTestHarness,
} from '../../../test';
import { getState, initialState, setState } from '../../../store/store';
import { PlayerStatus } from '../../../types';

const fixture = createGltfFixture({
  geometry: new THREE.BoxGeometry(1, 1, 1),
  nodes: [
    { name: 'Cylinder003' },
    { name: 'Cylinder003_1' },
    { name: 'Cylinder003_2' },
    { name: 'Cylinder003_3' },
    { name: 'Cylinder009' },
    { name: 'Cylinder009_1' },
    { name: 'Cylinder009_2' },
    { name: 'Cylinder009_3' },
  ],
  materials: {
    blackPlasticMaterial: new THREE.MeshStandardMaterial({ color: 'black' }),
    coffeeMaterial: new THREE.MeshStandardMaterial({ color: 'brown' }),
    cupRedEmmisiveMAterial: new THREE.MeshStandardMaterial({ color: 'red' }),
    cupWhiteMaterial: new THREE.MeshStandardMaterial({ color: 'white' }),
    salmonToukCupMaterial: new THREE.MeshStandardMaterial({ color: 'salmon' }),
  },
});

let body: MockRapierBody = createMockRapierBody({
  bodyType: 'kinematicPosition',
  translation: { x: 0, y: 1, z: 0 },
});
let bodyProps: Record<string, unknown> | undefined;
const rapierMocks = createRapierMocks({
  bodyFactory: (props) => {
    bodyProps = props;
    return body;
  },
});

vi.doMock('@react-spring/three', () => ({
  a: { group: 'group' },
  config: { slow: {} },
  useSpring: () => ({
    aPosition: {
      get: () => [0, 0, 0],
    },
  }),
}));
vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({
    '/transformMug.gltf': fixture,
  }),
}));
vi.doMock('@react-three/rapier', () => rapierMocks);

type CollisionHandler = () => void;

let TransformComponent!: typeof import('./Transform').Transform;
let renderer: R3FTestHarness | undefined;

beforeAll(async () => {
  ({ Transform: TransformComponent } = await import('./Transform'));
});

beforeEach(() => {
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
    playerStatus: null,
  });
  body = createMockRapierBody({
    bodyType: 'kinematicPosition',
    translation: { x: 0, y: 1, z: 0 },
  });
  bodyProps = undefined;
  rapierMocks.bodies.length = 0;
  rapierMocks.colliders.length = 0;
  rapierMocks.physics.length = 0;
});

afterEach(async () => {
  await renderer?.unmount();
  renderer = undefined;
});

function getCollisionHandler(): CollisionHandler {
  const handler = rapierMocks.colliders[0]?.props.onCollisionEnter;

  expect(handler).toEqual(expect.any(Function));
  return handler as CollisionHandler;
}

function setMugHeight(y: number): void {
  body.setTranslation({ x: 0, y, z: 0 }, true);
}

test('resets ready coffee only after a low mug impact', async () => {
  renderer = await render3D(<TransformComponent />);

  try {
    expect(bodyProps).toMatchObject({
      canSleep: false,
      colliders: false,
      mass: 0,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      type: 'kinematicPosition',
    });
    expect(body.state.bodyType).toBe('kinematicPosition');
    expect(rapierMocks.colliders).toHaveLength(1);
    expect(rapierMocks.colliders[0]).toMatchObject({
      kind: 'Cylinder',
      props: {
        args: [0.05, 0.05],
      },
    });

    const handler = getCollisionHandler();
    setState({
      coffeeState: 'ready',
      isLocked: true,
      letters: { t: true },
      playerStatus: PlayerStatus.PICKED,
    });
    const stateBeforeLowImpact = getState();

    setMugHeight(0.29);
    handler();

    expect(getState()).toEqual({
      ...stateBeforeLowImpact,
      coffeeState: null,
    });

    setState({ coffeeState: 'ready' });
    const stateAtThreshold = getState();
    setMugHeight(0.3);
    handler();
    expect(getState()).toEqual(stateAtThreshold);

    setMugHeight(0.31);
    handler();
    expect(getState()).toEqual(stateAtThreshold);
  } finally {
    await renderer.unmount();
    renderer = undefined;
  }
});
