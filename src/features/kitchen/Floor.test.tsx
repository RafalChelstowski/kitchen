import type { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';

import { createRapierMocks, render3D } from '../../test';

test('renders the documented fixed hidden floor collider configuration', async () => {
  vi.resetModules();
  const rapierMocks = createRapierMocks();
  vi.doMock('@react-three/rapier', () => rapierMocks);
  const { Floor } = await import('./Floor');
  const renderer = await render3D(<Floor />);
  const floorNode = renderer.findByName('floor');
  const floor = floorNode.instance as Mesh;
  const rigidBody = floor.parent;
  const rapierMetadata = rigidBody?.userData.rapier as {
    props: {
      colliders: string;
      friction: number;
      position: [number, number, number];
      restitution: number;
      rotation: [number, number, number];
      type: string;
    };
  };
  const geometry = floor.geometry as PlaneGeometry;
  const material = floor.material as MeshBasicMaterial;

  expect(rigidBody).toBeDefined();
  expect(rapierMetadata.props).toMatchObject({
    colliders: 'trimesh',
    friction: 0.85,
    position: [0, -4.5, 0],
    restitution: 0.05,
    rotation: [-Math.PI / 2, 0, 0],
    type: 'fixed',
  });
  expect(rapierMocks.bodies).toHaveLength(1);
  expect(rapierMocks.bodies[0].state.bodyType).toBe('fixed');
  expect(rapierMocks.bodies[0].state.translation).toEqual({
    x: 0,
    y: -4.5,
    z: 0,
  });
  expect(rigidBody?.position.toArray()).toEqual([0, -4.5, 0]);
  expect(rigidBody?.rotation.toArray()).toEqual([-Math.PI / 2, 0, 0, 'XYZ']);
  expect(geometry.parameters.width).toBe(100);
  expect(geometry.parameters.height).toBe(100);
  expect(floor.name).toBe('floor');
  expect(material.visible).toBe(false);

  await renderer.unmount();
});
