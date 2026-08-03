import * as THREE from 'three';

import {
  createGltfFixture,
  createRapierMocks,
  createUseGltfMock,
  render3D,
} from '../../test';

const HARD_SURFACE_FRICTION = 0.85;
const HARD_SURFACE_RESTITUTION = 0.05;

function getOrientedBoxWorldDimensions(
  halfExtents: THREE.Vector3,
  rotation: THREE.Euler
): THREE.Vector3 {
  const { elements } = new THREE.Matrix4().makeRotationFromEuler(rotation);

  return new THREE.Vector3(
    Math.abs(elements[0]) * halfExtents.x +
      Math.abs(elements[4]) * halfExtents.y +
      Math.abs(elements[8]) * halfExtents.z,
    Math.abs(elements[1]) * halfExtents.x +
      Math.abs(elements[5]) * halfExtents.y +
      Math.abs(elements[9]) * halfExtents.z,
    Math.abs(elements[2]) * halfExtents.x +
      Math.abs(elements[6]) * halfExtents.y +
      Math.abs(elements[10]) * halfExtents.z
  ).multiplyScalar(2);
}

test('renders supported GLTF bounds with fixed Rapier colliders', async () => {
  vi.resetModules();
  const fixture = createGltfFixture({
    nodes: [
      {
        name: 'KitchenCube',
        geometry: new THREE.BoxGeometry(2, 4, 6),
        position: [1, 2, 3],
        scale: [2, 0.5, 1.5],
      },
      {
        name: 'RotatedCube',
        geometry: new THREE.BoxGeometry(2, 4, 6),
        position: [-3, 1, 4],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 2, 1],
      },
      {
        name: 'KitchenCylinder',
        geometry: new THREE.CylinderGeometry(2, 2, 4, 16),
        position: [5, 3, -2],
        scale: [1.5, 0.5, 1.5],
      },
      {
        name: 'UnsupportedSurface',
        geometry: new THREE.SphereGeometry(1),
      },
      {
        name: 'CubeGroup',
        kind: 'group',
      },
    ],
  });
  const rapierMocks = createRapierMocks();

  vi.doMock('@react-three/drei', () => ({
    useGLTF: createUseGltfMock({ '/bounds.gltf': fixture }),
  }));
  vi.doMock('@react-three/rapier', () => rapierMocks);

  const { StaticBounds } = await import('./Bounds');
  const renderer = await render3D(<StaticBounds />);

  const staticCubes = renderer.findAllByName('static-cube');
  const staticCylinder = renderer.findByName('static-cylinder');

  expect(staticCubes).toHaveLength(2);
  expect(staticCylinder.instance.name).toBe('static-cylinder');
  expect(renderer.findAllByName('static-cylinder')).toHaveLength(1);
  expect(renderer.findAllByName('UnsupportedSurface')).toHaveLength(0);
  expect(renderer.findAllByName('CubeGroup')).toHaveLength(0);
  expect(rapierMocks.bodies).toHaveLength(3);
  expect(rapierMocks.colliders).toHaveLength(3);
  expect(rapierMocks.bodies.every((body) => body.state.bodyType === 'fixed')).toBe(
    true
  );

  const cube = staticCubes[0].instance as THREE.Mesh;
  const cubeBody = cube.parent;
  const cubeMetadata = cubeBody?.userData.rapier as {
    props: {
      colliders: false;
      position: [number, number, number];
      rotation: [number, number, number];
      type: string;
    };
  };

  expect(cubeMetadata.props).toMatchObject({
    colliders: false,
    position: [1, 2, 3],
    rotation: [0, 0, 0],
    type: 'fixed',
  });
  expect(cubeBody?.position.toArray()).toEqual([1, 2, 3]);
  expect(cubeBody?.rotation.toArray()).toEqual([0, 0, 0, 'XYZ']);
  expect(cube.scale.toArray()).toEqual([2, 0.5, 1.5]);
  expect(rapierMocks.colliders[0].kind).toBe('Cuboid');
  expect(rapierMocks.colliders[0].props).toMatchObject({
    args: [2, 1, 4.5],
    friction: HARD_SURFACE_FRICTION,
    restitution: HARD_SURFACE_RESTITUTION,
  });

  const rotatedCube = staticCubes[1].instance as THREE.Mesh;
  const rotatedCubeBody = rotatedCube.parent;
  const rotatedCubeMetadata = rotatedCubeBody?.userData.rapier as {
    props: {
      position: [number, number, number];
      rotation: [number, number, number];
    };
  };

  expect(rotatedCubeMetadata.props).toMatchObject({
    position: [-3, 1, 4],
    rotation: [0, Math.PI / 2, 0],
  });
  expect(rotatedCubeBody?.position.toArray()).toEqual([-3, 1, 4]);
  expect(rotatedCubeBody?.rotation.toArray()).toEqual([
    0,
    Math.PI / 2,
    0,
    'XYZ',
  ]);
  expect(rotatedCube.scale.toArray()).toEqual([1, 2, 1]);
  expect(rapierMocks.colliders[1].kind).toBe('Cuboid');
  const rotatedColliderProps = rapierMocks.colliders[1].props;
  const rotatedArgs = rotatedColliderProps.args as number[];
  expect(rotatedArgs).toHaveLength(3);
  expect(rotatedArgs[0]).toBeCloseTo(1);
  expect(rotatedArgs[1]).toBeCloseTo(4);
  expect(rotatedArgs[2]).toBeCloseTo(3);
  expect(rotatedColliderProps).toMatchObject({
    friction: HARD_SURFACE_FRICTION,
    restitution: HARD_SURFACE_RESTITUTION,
  });

  rotatedCubeBody?.updateMatrixWorld(true);
  const visualWorldSize = new THREE.Box3()
    .setFromObject(rotatedCube)
    .getSize(new THREE.Vector3());
  const colliderWorldSize = getOrientedBoxWorldDimensions(
    new THREE.Vector3(...rotatedArgs),
    rotatedCubeBody?.rotation ?? new THREE.Euler()
  );
  expect(colliderWorldSize.x).toBeCloseTo(visualWorldSize.x);
  expect(colliderWorldSize.y).toBeCloseTo(visualWorldSize.y);
  expect(colliderWorldSize.z).toBeCloseTo(visualWorldSize.z);

  const cylinderMesh = staticCylinder.instance as THREE.Mesh;
  const cylinderBody = cylinderMesh.parent;
  const cylinderMetadata = cylinderBody?.userData.rapier as {
    props: {
      colliders: false;
      position: [number, number, number];
      type: string;
    };
  };

  expect(cylinderMetadata.props).toMatchObject({
    colliders: false,
    position: [5, 3, -2],
    type: 'fixed',
  });
  expect(cylinderBody?.position.toArray()).toEqual([5, 3, -2]);
  expect(cylinderBody?.rotation.toArray()).toEqual([0, 0, 0, 'XYZ']);
  expect(cylinderMesh.scale.toArray()).toEqual([1.5, 0.5, 1.5]);
  expect(rapierMocks.colliders[2].kind).toBe('Cylinder');
  expect(rapierMocks.colliders[2].props).toMatchObject({
    args: [1, 3],
    friction: HARD_SURFACE_FRICTION,
    restitution: HARD_SURFACE_RESTITUTION,
  });

  const proxyMaterials = [
    ...staticCubes.map((node) => node.instance as THREE.Mesh),
    cylinderMesh,
  ].map((mesh) => mesh.material as THREE.MeshBasicMaterial);
  expect(proxyMaterials.every((proxyMaterial) => !proxyMaterial.visible)).toBe(
    true
  );

  await renderer.unmount();
});
