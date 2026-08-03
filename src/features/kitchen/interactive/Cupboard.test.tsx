import * as THREE from 'three';

import { createGltfFixture, createUseGltfMock, render3D } from '../../../test';

test('opens only for nearby clicks and stops handled event propagation', async () => {
  const fixture = createGltfFixture({
    nodes: [
      { name: 'Cube162' },
      { name: 'Cube162_1' },
      { name: 'cupboard', materialName: 'woodMaterial' },
    ],
    materials: {
      woodMaterial: new THREE.MeshStandardMaterial({ color: 'saddlebrown' }),
    },
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

  const { Cupboard } = await import('./Cupboard');
  const renderer = await render3D(<Cupboard />);
  const cupboardGroup = renderer.root.find(
    (node) => typeof node.props.onClick === 'function'
  );
  const cupboard = cupboardGroup.instance as THREE.Group;
  const closedRotation = 0;
  const openRotation = THREE.MathUtils.degToRad(65);

  expect(springTargets).toEqual([0]);
  expect(cupboard.rotation.y).toBe(closedRotation);

  const farStopPropagation = vi.fn();
  await renderer.fireEvent(cupboardGroup, 'click', {
    distance: 2.01,
    stopPropagation: farStopPropagation,
  });

  expect(farStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0]);
  expect(cupboard.rotation.y).toBe(closedRotation);

  const nearStopPropagation = vi.fn();
  await renderer.fireEvent(cupboardGroup, 'click', {
    distance: 1.99,
    stopPropagation: nearStopPropagation,
  });

  expect(nearStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0, 1]);
  expect(cupboard.rotation.y).toBeCloseTo(openRotation);

  await renderer.fireEvent(cupboardGroup, 'click', {
    distance: 1,
    stopPropagation: vi.fn(),
  });

  expect(springTargets).toEqual([0, 1, 0]);
  expect(cupboard.rotation.y).toBe(closedRotation);

  await renderer.unmount();
});
