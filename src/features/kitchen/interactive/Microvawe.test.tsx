import * as THREE from 'three';

import { createGltfFixture, createUseGltfMock, render3D } from '../../../test';

test('toggles only for nearby clicks and stops handled event propagation', async () => {
  const fixture = createGltfFixture({
    nodes: [
      { name: 'Cube192' },
      { name: 'Cube192_1' },
      { name: 'Cube193' },
      { name: 'Cube193_1' },
    ],
    materials: {
      steelMaterial: new THREE.MeshStandardMaterial({ color: 'silver' }),
      blackPlasticMaterial: new THREE.MeshStandardMaterial({ color: 'black' }),
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

  const { Microwave } = await import('./Microvawe');
  const renderer = await render3D(<Microwave />);
  const microwaveDoorGroup = renderer.root.find(
    (node) => typeof node.props.onClick === 'function'
  );
  const microwaveDoor = microwaveDoorGroup.instance as THREE.Group;
  const closedRotation = 0;
  const openRotation = THREE.MathUtils.degToRad(-83);

  expect(springTargets).toEqual([0]);
  expect(microwaveDoor.rotation.y).toBe(closedRotation);

  const farStopPropagation = vi.fn();
  await renderer.fireEvent(microwaveDoorGroup, 'click', {
    distance: 1.51,
    stopPropagation: farStopPropagation,
  });

  expect(farStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0]);
  expect(microwaveDoor.rotation.y).toBe(closedRotation);

  const nearStopPropagation = vi.fn();
  await renderer.fireEvent(microwaveDoorGroup, 'click', {
    distance: 1.49,
    stopPropagation: nearStopPropagation,
  });

  expect(nearStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0, 1]);
  expect(microwaveDoor.rotation.y).toBeCloseTo(openRotation);

  await renderer.fireEvent(microwaveDoorGroup, 'click', {
    distance: 1,
    stopPropagation: vi.fn(),
  });

  expect(springTargets).toEqual([0, 1, 0]);
  expect(microwaveDoor.rotation.y).toBe(closedRotation);

  await renderer.unmount();
});
