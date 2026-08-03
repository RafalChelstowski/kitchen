import { useRef } from 'react';

import * as THREE from 'three';

import { getState, initialState, setState, subscribe } from '../../../store/store';
import { AchievementName, InteractiveLetters } from '../../../types';
import {
  act,
  createFrameController,
  createGltfFixture,
  createUseFrameMock,
  createUseGltfMock,
  render3D,
  type R3FTestHarness,
} from '../../../test';

type LetterKey = keyof InteractiveLetters;
type PositionTuple = [number, number, number];

type SpringNext = (value: {
  position: PositionTuple;
}) => Promise<void>;
type SpringTo = (next: SpringNext) => Promise<void> | void;

interface SpringOptions {
  from: {
    position: PositionTuple;
  };
  to: SpringTo;
}

interface SpringValue {
  get: () => PositionTuple;
}

interface SpringRecord {
  readonly position: SpringValue;
  readonly steps: PositionTuple[];
  run: () => Promise<void>;
  to?: SpringTo;
}

const frameController = createFrameController();
const springRecords = new Map<string, SpringRecord>();
const addAchievement = vi.fn().mockResolvedValue(undefined);

const fixture = createGltfFixture({
  nodes: [
    { name: 'letterT' },
    { name: 'letterO' },
    { name: 'letterU' },
    { name: 'letterK' },
  ],
  materials: {
    toukLettersMaterial: new THREE.MeshStandardMaterial({ color: 'white' }),
  },
});

const letterSpecs: readonly {
  achievement: AchievementName;
  animation: readonly PositionTuple[];
  initialPosition: PositionTuple;
  key: LetterKey;
  nodeName: string;
  presentationPosition: PositionTuple;
}[] = [
  {
    achievement: AchievementName.AT,
    animation: [
      [0.1, 0.35, -4.1],
      [0.2, 1.5, -3.8],
      [2, 0.7, -1.8],
      [0.53, 0.98, 5.95],
    ],
    initialPosition: [0.2, 0.35, -3.8],
    key: 't',
    nodeName: 'letterT',
    presentationPosition: [0.53, 0.98, 5.95],
  },
  {
    achievement: AchievementName.BO,
    animation: [
      [-2.14, 1, -3.42],
      [-1.6, 1.5, -0.5],
      [2.6, 1, 0.1],
      [0.42, 0.98, 5.96],
    ],
    initialPosition: [-2.8, 0.82, -3.4],
    key: 'o',
    nodeName: 'letterO',
    presentationPosition: [0.42, 0.98, 5.96],
  },
  {
    achievement: AchievementName.CU,
    animation: [
      [2.1, 0.9, 0.28],
      [-2.3, 2, 3.9],
      [2.4, 1, 3.8],
      [0.29, 0.98, 5.98],
    ],
    initialPosition: [2.29, 0.75, 0.245],
    key: 'u',
    nodeName: 'letterU',
    presentationPosition: [0.29, 0.98, 5.98],
  },
  {
    achievement: AchievementName.DK,
    animation: [
      [1.9, 0.9, -3.65],
      [0.2, 2, 0.75],
      [0, 1.5, 5.6],
      [0.23, 0.98, 5.97],
    ],
    initialPosition: [2.9, 1, -3.82],
    key: 'k',
    nodeName: 'letterK',
    presentationPosition: [0.23, 0.98, 5.97],
  },
];

function createSpringRecord(initialPosition: PositionTuple): SpringRecord {
  const currentPosition: PositionTuple = [...initialPosition];
  const record: SpringRecord = {
    position: {
      get: () => [...currentPosition],
    },
    steps: [],
    run: async () => {
      if (!record.to) {
        throw new Error('The letter spring has not received an animation.');
      }

      await record.to(async ({ position }) => {
        const nextPosition: PositionTuple = [...position];
        currentPosition.splice(0, currentPosition.length, ...nextPosition);
        record.steps.push(nextPosition);
        frameController.advance();
      });
    },
  };

  return record;
}

function useSpring(options: SpringOptions): { position: SpringValue } {
  const recordRef = useRef<SpringRecord | null>(null);

  if (!recordRef.current) {
    const record = createSpringRecord(options.from.position);
    springRecords.set(options.from.position.join(','), record);
    recordRef.current = record;
  }

  recordRef.current.to = options.to;
  return { position: recordRef.current.position };
}

vi.doMock('@react-spring/three', () => ({
  a: { mesh: 'mesh' },
  config: { slow: {} },
  useSpring,
}));
vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({
    '/letters.gltf': fixture,
  }),
}));
vi.doMock('@react-three/fiber', async () => {
  const actual = await vi.importActual<typeof import('@react-three/fiber')>(
    '@react-three/fiber'
  );

  return {
    ...actual,
    useFrame: createUseFrameMock(frameController),
  };
});
vi.doMock('../../user/useAchievement', () => ({
  useAchievement: () => ({ addAchievement }),
}));

let Letters: typeof import('./Letters').Letters;

beforeAll(async () => {
  ({ Letters } = await import('./Letters'));
});

beforeEach(() => {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
  frameController.clear();
  springRecords.clear();
  addAchievement.mockClear();
});

function getLetterNode(
  renderer: R3FTestHarness,
  spec: (typeof letterSpecs)[number]
) {
  const geometry = (fixture.nodes[spec.nodeName] as THREE.Mesh).geometry;
  const node = renderer.root.findAll(
    (candidate) =>
      typeof candidate.props.onClick === 'function' &&
      (candidate.instance as THREE.Mesh).geometry === geometry
  )[0];

  if (!node) {
    throw new Error(`No rendered node found for letter ${spec.key}.`);
  }

  return node;
}

test('maps each letter to its store key and records only that collection', async () => {
  const renderer = await render3D(<Letters />);
  const letters: InteractiveLetters = {};
  const storeUpdates: InteractiveLetters[] = [];
  const unsubscribe = subscribe((state) => {
    storeUpdates.push({ ...state.letters });
  });

  try {
    for (const spec of letterSpecs) {
      const node = getLetterNode(renderer, spec);
      const stopPropagation = vi.fn();

      await renderer.fireEvent(node, 'click', { stopPropagation });

      letters[spec.key] = true;
      expect(stopPropagation).toHaveBeenCalledOnce();
      expect(getState().letters).toEqual(letters);
      expect(storeUpdates.at(-1)).toEqual(letters);
      expect(addAchievement).toHaveBeenNthCalledWith(
        storeUpdates.length,
        spec.achievement
      );
    }
  } finally {
    unsubscribe();
    await renderer.unmount();
  }
});

test('runs every letter animation path to its presentation position', async () => {
  for (const spec of letterSpecs) {
    setState({
      ...initialState,
      achievements: {},
      gfxSettings: { ...initialState.gfxSettings },
      letters: {},
    });
    frameController.clear();
    springRecords.clear();

    const renderer = await render3D(<Letters />);
    const node = getLetterNode(renderer, spec);
    const mesh = node.instance as THREE.Mesh;
    const springRecord = springRecords.get(spec.initialPosition.join(','));

    expect(springRecord).toBeDefined();

    try {
      await renderer.fireEvent(node, 'click', {
        stopPropagation: vi.fn(),
      });

      await act(async () => {
        await springRecord?.run();
      });

      expect(springRecord?.steps).toEqual(spec.animation);
      expect(mesh.position.toArray()).toEqual(spec.presentationPosition);
      expect(mesh.rotation.toArray()).toEqual([0, 0, 0, 'XYZ']);
    } finally {
      await renderer.unmount();
    }
  }
});

test('does not recollect a previously collected letter or rotate it', async () => {
  for (const spec of letterSpecs) {
    setState({
      ...initialState,
      achievements: {},
      gfxSettings: { ...initialState.gfxSettings },
      letters: { [spec.key]: true },
    });
    frameController.clear();
    springRecords.clear();

    const renderer = await render3D(<Letters />);
    const node = getLetterNode(renderer, spec);
    const mesh = node.instance as THREE.Mesh;
    const springRecord = springRecords.get(spec.initialPosition.join(','));
    const storeUpdates: InteractiveLetters[] = [];
    const unsubscribe = subscribe((state) => {
      storeUpdates.push({ ...state.letters });
    });

    try {
      const initialRotation = mesh.rotation.y;
      frameController.advance();
      expect(mesh.rotation.y).toBe(initialRotation);

      await renderer.fireEvent(node, 'click', {
        stopPropagation: vi.fn(),
      });
      await renderer.fireEvent(node, 'click', {
        stopPropagation: vi.fn(),
      });

      expect(getState().letters).toEqual({ [spec.key]: true });
      expect(storeUpdates).toHaveLength(0);
      expect(springRecord?.steps).toEqual([]);
      expect(addAchievement).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
      await renderer.unmount();
    }
  }
});

test('rotates only uncollected letters while they are not finished', async () => {
  const collectedKey: LetterKey = 't';
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: { [collectedKey]: true },
  });

  const renderer = await render3D(<Letters />);
  const meshes = letterSpecs.map((spec) => ({
    mesh: getLetterNode(renderer, spec).instance as THREE.Mesh,
    spec,
  }));

  try {
    const initialRotations = new Map(
      meshes.map(({ mesh, spec }) => [spec.key, mesh.rotation.y])
    );

    frameController.advance();

    meshes.forEach(({ mesh, spec }) => {
      const initialRotation = initialRotations.get(spec.key) ?? 0;
      const expectedRotation =
        spec.key === collectedKey ? initialRotation : initialRotation + 0.03;

      expect(mesh.rotation.y).toBe(expectedRotation);
    });

    const target = meshes.find(({ spec }) => spec.key === 'o');
    if (!target) {
      throw new Error('The uncollected O letter was not rendered.');
    }

    await renderer.fireEvent(getLetterNode(renderer, target.spec), 'click', {
      stopPropagation: vi.fn(),
    });
    const springRecord = springRecords.get(target.spec.initialPosition.join(','));

    await act(async () => {
      await springRecord?.run();
    });

    expect(target.mesh.rotation.toArray()).toEqual([0, 0, 0, 'XYZ']);
    frameController.advance();
    expect(target.mesh.rotation.toArray()).toEqual([0, 0, 0, 'XYZ']);
  } finally {
    await renderer.unmount();
  }
});
