import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type TransformTuple = [number, number, number];

export interface GltfFixtureNodeDefinition {
  name?: string;
  kind?: 'group' | 'mesh';
  parent?: string;
  children?: readonly GltfFixtureNodeDefinition[];
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
  materialName?: string;
  position?: THREE.Vector3 | TransformTuple;
  rotation?: THREE.Euler | TransformTuple;
  quaternion?: THREE.Quaternion;
  scale?: THREE.Vector3 | TransformTuple;
  visible?: boolean;
  userData?: Record<string, unknown>;
}

export interface GltfFixtureOptions {
  name?: string;
  nodes?:
    | readonly GltfFixtureNodeDefinition[]
    | Record<string, GltfFixtureNodeDefinition>;
  materials?: Record<string, THREE.Material>;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material;
  defaultColor?: THREE.ColorRepresentation;
}

export interface GltfFixtureResult extends Omit<GLTF, 'nodes' | 'materials'> {
  nodes: Record<string, THREE.Object3D>;
  materials: Record<string, THREE.Material>;
}

export type GLTFTestFixture = GltfFixtureResult;

const DEFAULT_MATERIAL_NAME = 'fixtureMaterial';

function setVector(
  target: THREE.Vector3,
  value: THREE.Vector3 | TransformTuple | undefined
): void {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    target.fromArray(value);
    return;
  }

  target.set(value.x, value.y, value.z);
}

function setEuler(
  target: THREE.Euler,
  value: THREE.Euler | TransformTuple | undefined
): void {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    target.set(...value);
    return;
  }

  target.set(value.x, value.y, value.z, value.order);
}

function applyTransform(
  object: THREE.Object3D,
  definition: GltfFixtureNodeDefinition
): void {
  setVector(object.position, definition.position);
  setEuler(object.rotation, definition.rotation);

  if (definition.quaternion) {
    object.quaternion.copy(definition.quaternion);
  }

  setVector(object.scale, definition.scale);

  if (definition.visible !== undefined) {
    object.visible = definition.visible;
  }

  if (definition.userData) {
    object.userData = { ...definition.userData };
  }
}

function createObject(
  definition: GltfFixtureNodeDefinition,
  materials: Record<string, THREE.Material>,
  defaultGeometry: THREE.BufferGeometry,
  defaultMaterial: THREE.Material
): THREE.Object3D {
  if (definition.kind === 'group') {
    const group = new THREE.Group();
    applyTransform(group, definition);
    return group;
  }

  const material =
    definition.material ??
    (definition.materialName
      ? materials[definition.materialName]
      : defaultMaterial);

  if (!material) {
    throw new Error(
      `No material named "${definition.materialName}" was provided for "${definition.name ?? 'fixture node'}".`
    );
  }

  const mesh = new THREE.Mesh(
    definition.geometry ?? defaultGeometry.clone(),
    material
  );
  applyTransform(mesh, definition);
  return mesh;
}

interface FlattenedDefinition {
  definition: GltfFixtureNodeDefinition;
  inheritedParent?: string;
  fallbackName: string;
}

function flattenDefinitions(
  definitions: readonly GltfFixtureNodeDefinition[],
  flattened: FlattenedDefinition[],
  inheritedParent?: string
): void {
  definitions.forEach((definition, index) => {
    const fallbackName = `${definition.kind ?? 'mesh'}-${flattened.length + index}`;
    flattened.push({ definition, inheritedParent, fallbackName });

    if (definition.children) {
      flattenDefinitions(
        definition.children,
        flattened,
        definition.name ?? fallbackName
      );
    }
  });
}

function normalizeDefinitions(
  nodes: GltfFixtureOptions['nodes']
): readonly GltfFixtureNodeDefinition[] {
  if (!nodes) {
    return [
      {
        name: 'fixture-parent',
        kind: 'group',
        position: [1, 2, 3],
        children: [
          {
            name: 'fixture-mesh',
            kind: 'mesh',
            position: [0.5, 0, 0],
          },
        ],
      },
    ];
  }

  if (Array.isArray(nodes)) {
    return nodes;
  }

  return Object.entries(nodes).map(([name, definition]) => ({
    ...definition,
    name: definition.name ?? name,
  }));
}

/**
 * Creates a small but real GLTF-shaped fixture. The result contains actual
 * Three.js geometry and materials, and every generated node is attached to
 * the returned scene according to its `parent` or `children` relationship.
 */
export function createGltfFixture(
  options: GltfFixtureOptions = {}
): GltfFixtureResult {
  const defaultGeometry =
    options.geometry?.clone() ?? new THREE.BoxGeometry(1, 1, 1);
  const defaultMaterial =
    options.material ??
    new THREE.MeshStandardMaterial({
      color: options.defaultColor ?? 0x6699cc,
    });
  const materials: Record<string, THREE.Material> = {
    [DEFAULT_MATERIAL_NAME]: defaultMaterial,
    ...options.materials,
  };
  const scene = new THREE.Group();
  scene.name = options.name ?? 'fixture-scene';

  const flattened: FlattenedDefinition[] = [];
  flattenDefinitions(normalizeDefinitions(options.nodes), flattened);

  const nodes: Record<string, THREE.Object3D> = {};
  const parents = new Map<string, string | undefined>();

  flattened.forEach(({ definition, fallbackName, inheritedParent }) => {
    const name = definition.name ?? fallbackName;
    const object = createObject(
      definition,
      materials,
      defaultGeometry,
      defaultMaterial
    );
    object.name = name;
    nodes[name] = object;
    parents.set(name, definition.parent ?? inheritedParent);
  });

  Object.entries(nodes).forEach(([name, object]) => {
    const parentName = parents.get(name);
    const parent = parentName ? nodes[parentName] : undefined;

    if (parent) {
      parent.add(object);
    } else {
      scene.add(object);
    }
  });

  return {
    animations: [],
    asset: {
      generator: 'kitchen test fixture',
      version: '2.0',
    },
    cameras: [],
    materials,
    nodes,
    parser: {} as GLTF['parser'],
    scene,
    scenes: [scene],
    userData: {
      fixture: true,
    },
  };
}

export interface MeshFixtureOptions {
  name?: string;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
  position?: THREE.Vector3 | TransformTuple;
  rotation?: THREE.Euler | TransformTuple;
  quaternion?: THREE.Quaternion;
  scale?: THREE.Vector3 | TransformTuple;
  visible?: boolean;
  userData?: Record<string, unknown>;
}

/** Creates an actual mesh for focused component tests. */
export function createMeshFixture(
  options: MeshFixtureOptions = {}
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    options.geometry ?? new THREE.BoxGeometry(1, 1, 1),
    options.material ?? new THREE.MeshStandardMaterial({ color: 0x6699cc })
  );

  mesh.name = options.name ?? 'fixture-mesh';
  applyTransform(mesh, options);
  return mesh;
}

/** Creates a named group that can be used as a parent in a fixture. */
export function createGroupFixture(
  name = 'fixture-group',
  children: readonly THREE.Object3D[] = []
): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.add(...children);
  return group;
}

export type GltfHook = ((path: string) => GltfFixtureResult) & {
  preload: (path: string) => void;
};

/**
 * Builds a `useGLTF`-compatible mock. Keeping this in the test harness avoids
 * loading the application's public assets in unit/component tests.
 */
export function createUseGltfMock(
  fixtures: Record<string, GltfFixtureResult>
): GltfHook {
  const useGLTF = ((path: string) => {
    const fixture = fixtures[path];
    if (!fixture) {
      throw new Error(`No GLTF fixture registered for "${path}".`);
    }

    return fixture;
  }) as GltfHook;

  useGLTF.preload = () => undefined;
  return useGLTF;
}

export const createGLTFFixture = createGltfFixture;
export const createGLTFResult = createGltfFixture;
export const createGltfMock = createUseGltfMock;
export const createUseGLTFMock = createUseGltfMock;
