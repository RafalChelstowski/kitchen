import type { ReactNode } from 'react';

import ReactThreeTestRenderer, {
  type ReactThreeTest,
} from '@react-three/test-renderer';
import type * as THREE from 'three';

import {
  findSceneNode,
  findSceneNodes,
  findTestInstanceByObject,
  getThreeObject,
} from './sceneTestUtils';

export type CreateOptions = ReactThreeTest.CreateOptions;
export type ReactThreeTestInstance = ReactThreeTest.ReactThreeTestInstance;
export type Renderer = ReactThreeTest.Renderer;

export type ThreeEventData = Record<string, unknown>;
export type R3FTestTarget = ReactThreeTestInstance | THREE.Object3D | string;

export interface R3FTestHarness extends Omit<Renderer, 'fireEvent'> {
  readonly root: ReactThreeTestInstance;
  findAllByName: (name: string) => ReactThreeTestInstance[];
  findByName: (name: string) => ReactThreeTestInstance;
  fireEvent: (
    target: R3FTestTarget,
    eventName: string,
    data?: ThreeEventData
  ) => Promise<unknown>;
  getObjectByName: (name: string) => THREE.Object3D;
}

function expectOne<T>(items: T[], description: string): T {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 0) {
    throw new Error(`No Three.js scene nodes found ${description}.`);
  }

  throw new Error(
    `Expected one Three.js scene node ${description}, found ${items.length}.`
  );
}

function resolveTarget(
  root: ReactThreeTestInstance,
  target: R3FTestTarget
): ReactThreeTestInstance {
  if (typeof target === 'string') {
    return expectOne(findSceneNodes(root, target), `named "${target}"`);
  }

  if ('instance' in target) {
    return target;
  }

  return (
    findTestInstanceByObject(root, target) ??
    (() => {
      throw new Error('The Three.js object is not part of this test scene.');
    })()
  );
}

/**
 * Renders a React Three Fiber tree using the official node renderer. It never
 * creates a browser WebGL context, while still constructing real Three.js
 * objects for scene, event, and frame assertions.
 */
export async function render3D(
  element: ReactNode,
  options: Partial<CreateOptions> = {}
): Promise<R3FTestHarness> {
  const renderer = await ReactThreeTestRenderer.create(element, options);

  return {
    ...renderer,
    root: renderer.scene,
    findAllByName: (name) => findSceneNodes(renderer.scene, name),
    findByName: (name) =>
      expectOne(findSceneNodes(renderer.scene, name), `named "${name}"`),
    fireEvent: (target, eventName, data = {}) =>
      renderer.fireEvent(resolveTarget(renderer.scene, target), eventName, data),
    getObjectByName: (name) => {
      const object = renderer.scene.instance.getObjectByName(name);
      if (!object) {
        throw new Error(`No Three.js scene object named "${name}" was found.`);
      }

      return object;
    },
  };
}

export { act, waitFor } from '@react-three/test-renderer';

export const createR3FTestRenderer = render3D;
export const createTestRenderer = render3D;
export const renderR3F = render3D;

export async function fireThreeEvent(
  renderer: R3FTestHarness,
  target: R3FTestTarget,
  eventName: string,
  data: ThreeEventData = {}
): Promise<unknown> {
  return renderer.fireEvent(target, eventName, data);
}

export { findSceneNode, getThreeObject };
export { findSceneObject, findSceneObjects, findSceneNodes } from './sceneTestUtils';
