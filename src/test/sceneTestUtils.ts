import type * as THREE from 'three';
import type { ReactThreeTest } from '@react-three/test-renderer';

export type SceneTestInstance = ReactThreeTest.ReactThreeTestInstance;
export type SceneTestNode = SceneTestInstance | THREE.Object3D;

function isThreeObject(value: unknown): value is THREE.Object3D {
  return (
    typeof value === 'object' &&
    value !== null &&
    'isObject3D' in value &&
    value.isObject3D === true
  );
}

export function getThreeObject(node: SceneTestNode): THREE.Object3D {
  return isThreeObject(node) ? node : node.instance;
}

export function findTestInstanceByObject(
  root: SceneTestInstance,
  object: THREE.Object3D
): SceneTestInstance | undefined {
  if (root.instance === object) {
    return root;
  }

  return root.findAll((node) => node.instance === object)[0];
}

export function findSceneObject(
  root: SceneTestInstance | THREE.Object3D,
  name: string
): THREE.Object3D | undefined {
  const object = getThreeObject(root);
  return object.getObjectByName(name) ?? undefined;
}

export function findSceneObjects(
  root: SceneTestInstance | THREE.Object3D,
  name: string
): THREE.Object3D[] {
  const object = getThreeObject(root);
  const matches: THREE.Object3D[] = [];

  object.traverse((child) => {
    if (child.name === name) {
      matches.push(child);
    }
  });

  return matches;
}

export function findSceneNode(
  root: SceneTestInstance,
  name: string
): SceneTestInstance | undefined {
  if (root.instance.name === name) {
    return root;
  }

  return root.findAll((node) => node.instance.name === name)[0];
}

export function findSceneNodes(
  root: SceneTestInstance,
  name: string
): SceneTestInstance[] {
  const nodes: SceneTestInstance[] = [];

  if (root.instance.name === name) {
    nodes.push(root);
  }

  nodes.push(...root.findAll((node) => node.instance.name === name));
  return nodes;
}

export function findSceneNodeByType(
  root: SceneTestInstance,
  type: string
): SceneTestInstance | undefined {
  if (root.type === type || root.instance.type === type) {
    return root;
  }

  return root.findAll(
    (node) => node.type === type || node.instance.type === type
  )[0];
}
