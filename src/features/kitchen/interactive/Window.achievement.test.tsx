import * as THREE from 'three';
import { toast } from 'react-toastify';

import { getState, initialState, setState } from '../../../store/store';
import {
  AchievementName,
  AchievementPayloadStatus,
} from '../../../types';
import {
  createGltfFixture,
  createMockRapierBody,
  createRapierMocks,
  createUseGltfMock,
  render3D,
} from '../../../test';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const fixture = createGltfFixture({
  geometry: new THREE.BoxGeometry(1, 1, 1),
  nodes: [
    {
      name: 'window_bound',
      geometry: new THREE.BoxGeometry(2, 4, 6),
      position: [1.25, 2.5, -3.75],
      scale: [1.5, 0.5, 0.75],
    },
    { name: 'Cylinder002' },
    { name: 'Cylinder002_1' },
    { name: 'Cylinder002_2' },
  ],
  materials: {
    whiteMaterial: new THREE.MeshStandardMaterial({ color: 'white' }),
  },
});
const textures = new Map<string, THREE.Texture>();
const rapierMocks = createRapierMocks({
  body: createMockRapierBody({ bodyType: 'kinematicPosition' }),
});

vi.doMock('@react-spring/three', () => ({
  a: { group: 'group' },
  useSpring: ({ spring: target }: { spring: number }) => ({
    spring: {
      to: (_input: readonly number[], output: readonly number[]) =>
        output[target],
    },
  }),
}));
vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({
    '/kitchen_interactives.gltf': fixture,
  }),
  useTexture: (path: string) => {
    const texture = textures.get(path) ?? new THREE.Texture();
    textures.set(path, texture);
    return texture;
  },
}));
vi.doMock('@react-three/rapier', () => rapierMocks);

let InteractiveWindow: typeof import('./Window').InteractiveWindow;

beforeAll(async () => {
  ({ InteractiveWindow } = await import('./Window'));
});

beforeEach(() => {
  localStorage.clear();
  textures.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

test('unlocks the window only for nearby clicks and keeps the first payload', async () => {
  const renderer = await render3D(<InteractiveWindow />);
  const windowGroup = renderer.root.find(
    (node) => typeof node.props.onClick === 'function'
  );

  try {
    const outOfRangeStopPropagation = vi.fn();
    await renderer.fireEvent(windowGroup, 'click', {
      distance: 1.51,
      stopPropagation: outOfRangeStopPropagation,
    });

    expect(outOfRangeStopPropagation).toHaveBeenCalledOnce();
    expect(getState().achievements[AchievementName.WINDOW]).toBeUndefined();
    expect(toast.success).not.toHaveBeenCalled();

    const inRangeStopPropagation = vi.fn();
    await renderer.fireEvent(windowGroup, 'click', {
      distance: 1.49,
      stopPropagation: inRangeStopPropagation,
    });

    const firstPayload = getState().achievements[AchievementName.WINDOW];

    expect(inRangeStopPropagation).toHaveBeenCalledOnce();
    expect(firstPayload).toEqual({
      date: new Date('2026-05-16T12:00:00.000Z').toDateString(),
      status: AchievementPayloadStatus.NEW,
    });
    expect(toast.success).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('New achievement!');

    vi.setSystemTime(new Date('2026-05-17T12:00:00.000Z'));
    await renderer.fireEvent(windowGroup, 'click', {
      distance: 1,
      stopPropagation: vi.fn(),
    });

    expect(getState().achievements[AchievementName.WINDOW]).toBe(firstPayload);
    expect(getState().achievements[AchievementName.WINDOW]).toEqual({
      date: new Date('2026-05-16T12:00:00.000Z').toDateString(),
      status: AchievementPayloadStatus.NEW,
    });
    expect(toast.success).toHaveBeenCalledOnce();
  } finally {
    await renderer.unmount();
  }
});
