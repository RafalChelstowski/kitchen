import * as THREE from 'three';

import { intersectStaticBounds } from './staticBoundsRaycast';

function createMesh(name: string) {
  const mesh = new THREE.Mesh();
  mesh.name = name;
  return mesh;
}

function createIntersection(object: THREE.Object3D, distance: number) {
  return {
    distance,
    point: new THREE.Vector3(),
    object,
  };
}

test('filters bounds intersections by static names without changing raycaster order', () => {
  const scene = new THREE.Scene();
  const bounds = new THREE.Group();
  bounds.name = 'bounds';

  const staticGroup = new THREE.Group();
  staticGroup.name = 'static-counter';
  const ancestorMatch = createMesh('counter-surface');
  staticGroup.add(ancestorMatch);

  const directMatch = createMesh('static-floor');
  const interactiveHit = createMesh('interactive-drawer');
  bounds.add(staticGroup, directMatch, interactiveHit);

  const outsideStatic = createMesh('static-outside-bounds');
  scene.add(bounds, outsideStatic);

  const ancestorIntersection = createIntersection(ancestorMatch, 5);
  const interactiveIntersection = createIntersection(interactiveHit, 1);
  const directIntersection = createIntersection(directMatch, 3);
  const raycaster = new THREE.Raycaster();
  const intersectObjects = vi
    .spyOn(raycaster, 'intersectObjects')
    .mockReturnValue([
      ancestorIntersection,
      interactiveIntersection,
      directIntersection,
    ]);

  const result = intersectStaticBounds(raycaster, scene);

  expect(intersectObjects).toHaveBeenCalledWith(bounds.children, true);
  expect(result).toHaveLength(2);
  expect(result[0]).toBe(ancestorIntersection);
  expect(result[1]).toBe(directIntersection);
});

test('uses scene children and filters non-static intersections when bounds are absent', () => {
  const scene = new THREE.Scene();
  const staticGroup = new THREE.Group();
  staticGroup.name = 'static-wall';
  const staticSurface = createMesh('wall-surface');
  staticGroup.add(staticSurface);

  const interactiveHit = createMesh('interactive-handle');
  scene.add(staticGroup, interactiveHit);

  const interactiveIntersection = createIntersection(interactiveHit, 1);
  const staticIntersection = createIntersection(staticSurface, 2);
  const raycaster = new THREE.Raycaster();
  const intersectObjects = vi
    .spyOn(raycaster, 'intersectObjects')
    .mockReturnValue([interactiveIntersection, staticIntersection]);

  const result = intersectStaticBounds(raycaster, scene);

  expect(intersectObjects).toHaveBeenCalledWith(scene.children, true);
  expect(result).toHaveLength(1);
  expect(result[0]).toBe(staticIntersection);
});
