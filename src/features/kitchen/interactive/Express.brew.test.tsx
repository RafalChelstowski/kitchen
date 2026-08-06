import * as THREE from 'three';
import { toast } from 'react-toastify';

import {
  act,
  createGltfFixture,
  createRapierMocks,
  createUseGltfMock,
  render3D,
  type R3FTestHarness,
} from '../../../test';
import { getState, initialState, setState } from '../../../store/store';
import {
  AchievementName,
  AchievementPayloadStatus,
  type State,
} from '../../../types';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const kitchenFixture = createGltfFixture({
  nodes: [
    { name: 'bake_express' },
    { name: 'bake_grinder' },
    { name: 'buttons' },
    { name: 'buttons_pressable' },
    { name: 'grinderGlass' },
    { name: 'bin' },
    { name: 'coffeeAccesories' },
  ],
});
const accessoriesFixture = createGltfFixture({
  nodes: [
    { name: 'kolba' },
    { name: 'coffeePortion' },
    { name: 'tamper' },
  ],
  materials: {
    coffeeAccMaterial: new THREE.MeshStandardMaterial({ color: 'brown' }),
  },
});
const textures = new Map<string, THREE.Texture>();
const rapierMocks = createRapierMocks();
const camera = new THREE.PerspectiveCamera();
const raycaster = new THREE.Raycaster();
let renderedScene: THREE.Scene | undefined;
const scene = {
  getObjectByName: (name: string) => renderedScene?.getObjectByName(name),
} as unknown as THREE.Scene;
const threeState = { camera, raycaster, scene };
const raycast = vi.spyOn(raycaster, 'intersectObjects');

vi.doMock('@react-spring/three', () => ({
  a: { group: 'group' },
  config: { default: {}, wobbly: {} },
  useSpring: () => ({
    position: { get: () => [0, 0, 0] },
    rotation: { get: () => [0, 0, 0] },
    scale: { get: () => 0 },
    tamperPosition: { get: () => [0, 0, 0] },
  }),
}));
vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({
    '/kitchen_interactives.gltf': kitchenFixture,
    '/express_acc.gltf': accessoriesFixture,
  }),
  useTexture: (path: string) => {
    const texture = textures.get(path) ?? new THREE.Texture();
    textures.set(path, texture);
    return texture;
  },
}));
vi.doMock('@react-three/fiber', async () => {
  const actual = await vi.importActual<typeof import('@react-three/fiber')>(
    '@react-three/fiber'
  );

  return {
    ...actual,
    useFrame: () => undefined,
    useThree: <T,>(selector: (state: typeof threeState) => T): T =>
      selector(threeState),
  };
});
vi.doMock('@react-three/rapier', () => rapierMocks);

let ExpressComponent!: typeof import('./Express').Express;

beforeAll(async () => {
  ({ Express: ExpressComponent } = await import('./Express'));
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
  textures.clear();
  rapierMocks.bodies.length = 0;
  rapierMocks.colliders.length = 0;
  rapierMocks.physics.length = 0;
  renderedScene = undefined;
  raycast.mockReset();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

async function renderExpress(): Promise<R3FTestHarness> {
  const renderer = await render3D(<ExpressComponent />);
  renderedScene = renderer.root.instance as THREE.Scene;
  return renderer;
}

function setCoffeeState(coffeeState: State['coffeeState']): void {
  setState({ coffeeState });
}

function queueButtonHit(renderer: R3FTestHarness, distance: number): void {
  raycast.mockReturnValueOnce([
    {
      distance,
      object: renderer.getObjectByName('button-make'),
    } as THREE.Intersection,
  ]);
}

async function dispatchClick(): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new MouseEvent('click'));
  });
}

test('brews cup-ready coffee and records COFFEE once for a nearby make-button hit', async () => {
  setCoffeeState('cupReady');
  const renderer = await renderExpress();

  try {
    const makeButton = renderer.getObjectByName('button-make');
    queueButtonHit(renderer, 1.99);

    await dispatchClick();

    const firstAchievement = getState().achievements[AchievementName.COFFEE];

    expect(raycast).toHaveBeenCalledWith(
      expect.arrayContaining([makeButton])
    );
    expect(getState().coffeeState).toBe('ready');
    expect(firstAchievement).toEqual({
      date: new Date('2026-05-16T12:00:00.000Z').toDateString(),
      status: AchievementPayloadStatus.NEW,
    });
    expect(toast.success).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('New achievement!');

    vi.setSystemTime(new Date('2026-05-17T12:00:00.000Z'));
    queueButtonHit(renderer, 1);

    await dispatchClick();

    expect(getState().coffeeState).toBe('ready');
    expect(getState().achievements[AchievementName.COFFEE]).toBe(
      firstAchievement
    );
    expect(toast.success).toHaveBeenCalledOnce();
  } finally {
    await renderer.unmount();
  }
});

test('does not brew or unlock COFFEE from a non-cup-ready prerequisite state', async () => {
  const renderer = await renderExpress();

  try {
    const prerequisiteStates: State['coffeeState'][] = [
      null,
      'grinded',
      'tempered',
      'gripAttached',
      'inProgress',
    ];

    for (const coffeeState of prerequisiteStates) {
      setCoffeeState(coffeeState);
      queueButtonHit(renderer, 1);

      await dispatchClick();

      expect(getState().coffeeState).toBe(coffeeState);
      expect(getState().achievements[AchievementName.COFFEE]).toBeUndefined();
    }

    expect(toast.success).not.toHaveBeenCalled();
  } finally {
    await renderer.unmount();
  }
});

test('ignores a make-button hit beyond two units', async () => {
  setCoffeeState('cupReady');
  const renderer = await renderExpress();

  try {
    queueButtonHit(renderer, 2.01);

    await dispatchClick();

    expect(getState().coffeeState).toBe('cupReady');
    expect(getState().achievements[AchievementName.COFFEE]).toBeUndefined();
    expect(toast.success).not.toHaveBeenCalled();
  } finally {
    await renderer.unmount();
  }
});
