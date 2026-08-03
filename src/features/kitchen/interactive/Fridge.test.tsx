import * as THREE from 'three';
import { toast } from 'react-toastify';

import { getState, initialState, setState } from '../../../store/store';
import { AchievementName, AchievementPayloadStatus } from '../../../types';
import { createGltfFixture, createUseGltfMock, render3D } from '../../../test';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
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

test('toggles the door for nearby clicks and records the fridge achievement once', async () => {
  const fixture = createGltfFixture({
    nodes: [
      { name: 'Cube010' },
      { name: 'Cube010_1' },
      { name: 'Cube010_2' },
      { name: 'fridgeInside' },
      { name: 'glass' },
    ],
  });
  const springTargets: number[] = [];
  const textures = new Map<string, THREE.Texture>();

  vi.doMock('@react-spring/three', () => ({
    a: { group: 'group' },
    useSpring: ({ spring: target }: { spring: number }) => {
      springTargets.push(target);

      return {
        spring: {
          to: (_input: readonly number[], output: readonly number[]) =>
            output[target],
        },
      };
    },
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

  const { Fridge } = await import('./Fridge');
  const renderer = await render3D(<Fridge />);
  const doorGroup = renderer.root.find(
    (node) => typeof node.props.onClick === 'function'
  );
  const door = doorGroup.instance as THREE.Group;
  const closedRotation = 0;
  const openRotation = THREE.MathUtils.degToRad(88);

  expect(springTargets).toEqual([0]);
  expect(door.rotation.y).toBe(closedRotation);
  expect(getState().achievements[AchievementName.FRIDGE]).toBeUndefined();

  const farStopPropagation = vi.fn();
  await renderer.fireEvent(doorGroup, 'click', {
    distance: 1.51,
    stopPropagation: farStopPropagation,
  });

  expect(farStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0]);
  expect(door.rotation.y).toBe(closedRotation);
  expect(getState().achievements[AchievementName.FRIDGE]).toBeUndefined();
  expect(toast.success).not.toHaveBeenCalled();

  const nearStopPropagation = vi.fn();
  await renderer.fireEvent(doorGroup, 'click', {
    distance: 1.49,
    stopPropagation: nearStopPropagation,
  });

  const firstAchievement = getState().achievements[AchievementName.FRIDGE];

  expect(nearStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0, 1]);
  expect(door.rotation.y).toBeCloseTo(openRotation);
  expect(firstAchievement).toEqual({
    date: new Date('2026-05-16T12:00:00.000Z').toDateString(),
    status: AchievementPayloadStatus.NEW,
  });
  expect(toast.success).toHaveBeenCalledOnce();
  expect(toast.success).toHaveBeenCalledWith('New achievement!');

  await renderer.fireEvent(doorGroup, 'click', {
    distance: 1,
    stopPropagation: vi.fn(),
  });

  expect(springTargets).toEqual([0, 1, 0]);
  expect(door.rotation.y).toBe(closedRotation);
  expect(getState().achievements[AchievementName.FRIDGE]).toBe(
    firstAchievement
  );
  expect(toast.success).toHaveBeenCalledOnce();

  await renderer.unmount();
});
