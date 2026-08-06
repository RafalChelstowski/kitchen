import * as THREE from 'three';

import {
  createGltfFixture,
  createMockRapierBody,
  createRapierMocks,
  createUseGltfMock,
  render3D,
} from '../../../test';
import { AchievementName } from '../../../types';

test('moves the kinematic window blocker only for nearby clicks', async () => {
  const initialPosition: [number, number, number] = [1.25, 2.5, -3.75];
  const fixture = createGltfFixture({
    geometry: new THREE.BoxGeometry(1, 1, 1),
    nodes: [
      {
        name: 'window_bound',
        geometry: new THREE.BoxGeometry(2, 4, 6),
        position: initialPosition,
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
  const body = createMockRapierBody({ bodyType: 'kinematicPosition' });
  let bodyProps: Record<string, unknown> | undefined;
  const rapierMocks = createRapierMocks({
    bodyFactory: (props) => {
      bodyProps = props;
      return body;
    },
  });
  const addAchievement = vi.fn().mockResolvedValue(undefined);
  const textures = new Map<string, THREE.Texture>();

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
  vi.doMock('../../user/useAchievement', () => ({
    useAchievement: () => ({ addAchievement }),
  }));

  const { InteractiveWindow } = await import('./Window');
  const renderer = await render3D(<InteractiveWindow />);
  const blocker = renderer.root.find(
    (node) => typeof node.props.onClick === 'function'
  );
  const initialTranslation = {
    x: initialPosition[0],
    y: initialPosition[1],
    z: initialPosition[2],
  };
  const openTranslation = {
    x: initialPosition[0],
    y: initialPosition[1] + 5,
    z: initialPosition[2],
  };

  expect(bodyProps).toMatchObject({
    colliders: false,
    position: initialPosition,
    type: 'kinematicPosition',
  });
  expect(body.state.bodyType).toBe('kinematicPosition');
  expect(rapierMocks.colliders).toHaveLength(1);
  expect(rapierMocks.colliders[0]).toMatchObject({
    kind: 'Cuboid',
    props: {
      args: [1.5, 1, 2.25],
    },
  });
  expect(body.state.translation).toEqual(initialTranslation);

  const callsAfterRender = body.calls.length;
  await renderer.fireEvent(blocker, 'click', {
    distance: 1.51,
    stopPropagation: vi.fn(),
  });

  expect(body.state.translation).toEqual(initialTranslation);
  expect(body.calls).toHaveLength(callsAfterRender);
  expect(addAchievement).not.toHaveBeenCalled();

  await renderer.fireEvent(blocker, 'click', {
    distance: 1.49,
    stopPropagation: vi.fn(),
  });

  expect(body.state.translation).toEqual(openTranslation);
  expect(body.calls.slice(-2)).toEqual([
    {
      method: 'setNextKinematicTranslation',
      args: [openTranslation],
    },
    {
      method: 'setTranslation',
      args: [openTranslation, true],
    },
  ]);
  expect(addAchievement).toHaveBeenCalledWith(AchievementName.WINDOW);

  await renderer.fireEvent(blocker, 'click', {
    distance: 1,
    stopPropagation: vi.fn(),
  });

  expect(body.state.translation).toEqual(initialTranslation);
  expect(body.calls.slice(-2)).toEqual([
    {
      method: 'setNextKinematicTranslation',
      args: [initialTranslation],
    },
    {
      method: 'setTranslation',
      args: [initialTranslation, true],
    },
  ]);

  const callsAfterClose = body.calls.length;
  await renderer.fireEvent(blocker, 'click', {
    distance: 1.51,
    stopPropagation: vi.fn(),
  });

  expect(body.state.translation).toEqual(initialTranslation);
  expect(body.calls).toHaveLength(callsAfterClose);
  expect(addAchievement).toHaveBeenCalledTimes(2);

  await renderer.unmount();
});
