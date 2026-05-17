import * as THREE from 'three';

function objectOrParentNameStartsWith(
  object: THREE.Object3D | undefined,
  prefix: string
) {
  let current = object;

  while (current) {
    if (current.name.startsWith(prefix)) {
      return true;
    }

    current = current.parent ?? undefined;
  }

  return false;
}

export function intersectStaticBounds(
  raycaster: THREE.Raycaster,
  scene: THREE.Scene
) {
  const bounds = scene.getObjectByName('bounds');
  const intersections = raycaster.intersectObjects(
    bounds?.children || scene.children,
    true
  );

  return intersections.filter((intersection) =>
    objectOrParentNameStartsWith(intersection.object, 'static')
  );
}
