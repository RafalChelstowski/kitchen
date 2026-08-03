import * as THREE from 'three';

import { createGltfFixture, createUseGltfMock, render3D } from '../../../test';

test('toggles only for nearby clicks and stops handled event propagation', async () => {
  const fixture = createGltfFixture({
    nodes: [{ name: 'Cube165' }, { name: 'Cube165_1' }],
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

  const { Drawer } = await import('./Drawer');
  const renderer = await render3D(<Drawer />);
  const drawerGroup = renderer.root.find(
    (node) => typeof node.props.onClick === 'function'
  );
  const drawer = drawerGroup.instance as THREE.Group;
  const closedPositionX = 2.42;
  const openPositionX = 2.2;

  expect(springTargets).toEqual([0]);
  expect(drawer.position.x).toBe(closedPositionX);

  const farStopPropagation = vi.fn();
  await renderer.fireEvent(drawerGroup, 'click', {
    distance: 1.51,
    stopPropagation: farStopPropagation,
  });

  expect(farStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0]);
  expect(drawer.position.x).toBe(closedPositionX);

  const nearStopPropagation = vi.fn();
  await renderer.fireEvent(drawerGroup, 'click', {
    distance: 1.49,
    stopPropagation: nearStopPropagation,
  });

  expect(nearStopPropagation).toHaveBeenCalledOnce();
  expect(springTargets).toEqual([0, 1]);
  expect(drawer.position.x).toBe(openPositionX);

  await renderer.fireEvent(drawerGroup, 'click', {
    distance: 1,
    stopPropagation: vi.fn(),
  });

  expect(springTargets).toEqual([0, 1, 0]);
  expect(drawer.position.x).toBe(closedPositionX);

  await renderer.unmount();
});
