import * as THREE from 'three';

import {
  act,
  createFrameController,
  createGltfFixture,
  createMockRapierBody,
  createRapierMocks,
  createUseFrameMock,
  createUseGltfMock,
  render3D,
  type MockRapierBody,
  type R3FTestHarness,
} from '../../test';
import { getState, initialState, setState } from '../../store/store';
import { PlayerStatus } from '../../types';

const fixture = createGltfFixture({
  geometry: new THREE.BoxGeometry(1, 1, 1),
  nodes: [{ name: 'mugGeometry' }],
  materials: {
    mugMaterial: new THREE.MeshStandardMaterial({ color: 'white' }),
  },
});
const frameController = createFrameController();
const camera = new THREE.PerspectiveCamera();
const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();
const mugRaycastRoot = new THREE.Group();
mugRaycastRoot.name = 'mug';
scene.add(mugRaycastRoot);
const threeState = { camera, raycaster, scene };
let nextBodies: MockRapierBody[] = [];
let bodyIndex = 0;

const rapierMocks = createRapierMocks({
  bodyFactory: () => {
    const body = nextBodies[bodyIndex];
    bodyIndex += 1;

    if (!body) {
      throw new Error('A mock mug body was not configured.');
    }

    return body;
  },
});

vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({ '/mugs.gltf': fixture }),
}));
vi.doMock('@react-three/fiber', async () => {
  const actual = await vi.importActual<typeof import('@react-three/fiber')>(
    '@react-three/fiber'
  );

  return {
    ...actual,
    useFrame: createUseFrameMock(frameController),
    useThree: <T,>(selector: (state: typeof threeState) => T): T =>
      selector(threeState),
  };
});
vi.doMock('@react-three/rapier', () => rapierMocks);

let MugsComponent!: typeof import('./Mugs').Mugs;
let renderer: R3FTestHarness | undefined;

beforeAll(async () => {
  ({ Mugs: MugsComponent } = await import('./Mugs'));
});

beforeEach(() => {
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
    playerStatus: null,
  });
  frameController.clear();
  nextBodies = [
    createMockRapierBody(),
    createMockRapierBody(),
    createMockRapierBody(),
  ];
  bodyIndex = 0;
  rapierMocks.bodies.length = 0;
  rapierMocks.colliders.length = 0;
  rapierMocks.physics.length = 0;
});

afterEach(async () => {
  await renderer?.unmount();
  renderer = undefined;
  frameController.clear();
  vi.restoreAllMocks();
});

function renderMugs(): Promise<R3FTestHarness> {
  return render3D(
    <MugsComponent
      initialPosition={[1, 2, 3]}
      objName="mugs"
      geometryName="mugGeometry"
      materialName="mugMaterial"
      gltfName="/mugs.gltf"
      itemsNumber={3}
      rowModifier={2}
    />
  );
}

function intersection(
  object: THREE.Object3D,
  distance: number,
  point = new THREE.Vector3()
): THREE.Intersection {
  return { distance, point, object };
}

async function dispatchDomEvent(event: Event): Promise<void> {
  await act(async () => {
    window.dispatchEvent(event);
  });
}

test('picks one mug, follows the camera, and throws it through Rapier', async () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.1);
  renderer = await renderMugs();
  const mugMeshes = renderer.findAllByName('mugs');
  const selectedMesh = mugMeshes[1].instance as THREE.Mesh;
  const heldMesh = renderer.findByName('mugs_held').instance as THREE.Mesh;
  const selectedBody = nextBodies[1];

  expect(mugMeshes).toHaveLength(3);
  expect(rapierMocks.bodies).toHaveLength(3);
  expect(rapierMocks.colliders).toHaveLength(3);

  const raycast = vi
    .spyOn(raycaster, 'intersectObjects')
    .mockReturnValueOnce([intersection(selectedMesh, 1)])
    .mockReturnValueOnce([
      intersection(new THREE.Mesh(), 20, new THREE.Vector3(-16, 3, 5)),
    ]);

  await dispatchDomEvent(new MouseEvent('click'));

  expect(selectedBody.state.enabled).toBe(false);
  expect(nextBodies[0].state.enabled).toBe(true);
  expect(nextBodies[2].state.enabled).toBe(true);
  expect(selectedBody.calls).toEqual([
    { method: 'setEnabled', args: [false] },
  ]);
  expect(heldMesh.visible).toBe(true);
  expect((mugMeshes[0].instance as THREE.Mesh).visible).toBe(true);
  expect(selectedMesh.visible).toBe(false);
  expect((mugMeshes[2].instance as THREE.Mesh).visible).toBe(true);
  expect(getState().playerStatus).toBe(PlayerStatus.PICKED);
  expect(raycast).toHaveBeenCalledWith(mugRaycastRoot.children, true);

  camera.position.set(4, 3, 5);
  camera.rotation.set(0, Math.PI / 2, 0);
  camera.updateMatrixWorld(true);
  frameController.advanceFrames();

  expect(heldMesh.position.toArray()).toEqual([3.6, 2.85, 4.85]);
  expect(heldMesh.rotation.y).toBeCloseTo(Math.PI / 2);

  random
    .mockReturnValueOnce(0.2)
    .mockReturnValueOnce(0.4)
    .mockReturnValueOnce(0.6);
  await dispatchDomEvent(new KeyboardEvent('keydown', { key: ' ' }));

  const throwCalls = selectedBody.calls.slice(-6);
  expect(throwCalls.map(({ method }) => method)).toEqual([
    'setEnabled',
    'setTranslation',
    'setRotation',
    'setLinvel',
    'setAngvel',
    'setRotation',
  ]);
  expect(throwCalls[0].args).toEqual([true]);
  expect(throwCalls[1].args[0]).toEqual({ x: 3.6, y: 2.85, z: 4.85 });
  expect(throwCalls[1].args[1]).toBe(true);
  const synchronizedRotation = (
    throwCalls[2].args[0] as THREE.Quaternion
  ).toArray();
  expect(synchronizedRotation[0]).toBeCloseTo(0);
  expect(synchronizedRotation[1]).toBeCloseTo(Math.SQRT1_2);
  expect(synchronizedRotation[2]).toBeCloseTo(0);
  expect(synchronizedRotation[3]).toBeCloseTo(Math.SQRT1_2);
  const linearVelocity = throwCalls[3].args[0] as {
    x: number;
    y: number;
    z: number;
  };
  expect(linearVelocity.x).toBeCloseTo(-10);
  expect(linearVelocity.y).toBeCloseTo(0);
  expect(linearVelocity.z).toBeCloseTo(0);
  expect(throwCalls[3].args[1]).toBe(true);
  expect(throwCalls[4].args).toEqual([
    { x: 0, y: 0, z: 0 },
    true,
  ]);

  const expectedThrowRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.6, 1.2, 1.8)
  );
  const throwRotation = (throwCalls[5].args[0] as THREE.Quaternion).toArray();
  const expectedRotation = expectedThrowRotation.toArray();
  throwRotation.forEach((value, index) => {
    expect(value).toBeCloseTo(expectedRotation[index]);
  });
  expect(throwCalls[5].args[1]).toBe(true);
  expect(selectedBody.state.enabled).toBe(true);
  expect(selectedBody.state.translation).toEqual({ x: 3.6, y: 2.85, z: 4.85 });
  expect(selectedBody.state.linearVelocity.x).toBeCloseTo(-10);
  expect(selectedBody.state.linearVelocity.y).toBeCloseTo(0);
  expect(selectedBody.state.linearVelocity.z).toBeCloseTo(0);
  expect(selectedBody.state.angularVelocity).toEqual({ x: 0, y: 0, z: 0 });
  expect(heldMesh.visible).toBe(false);
  expect(selectedMesh.visible).toBe(true);
  expect(getState().playerStatus).toBeNull();
  expect(raycast).toHaveBeenCalledTimes(2);
});

test('ignores missing, distant, and non-indexed mug intersections', async () => {
  renderer = await renderMugs();
  const mugMesh = renderer.findAllByName('mugs')[0].instance as THREE.Mesh;
  const raycast = vi
    .spyOn(raycaster, 'intersectObjects')
    .mockReturnValueOnce([])
    .mockReturnValueOnce([intersection(mugMesh, 2.01)])
    .mockReturnValueOnce([intersection(new THREE.Mesh(), 1)]);

  await dispatchDomEvent(new MouseEvent('click'));
  await dispatchDomEvent(new MouseEvent('click'));
  await dispatchDomEvent(new MouseEvent('click'));

  expect(raycast).toHaveBeenCalledTimes(3);
  expect(rapierMocks.bodies).toHaveLength(3);
  expect(rapierMocks.bodies.every((body) => body.calls.length === 0)).toBe(
    true
  );
  expect(rapierMocks.bodies.every((body) => body.state.enabled)).toBe(true);
  expect(renderer.findByName('mugs_held').instance.visible).toBe(false);
  expect(getState().playerStatus).toBeNull();
});
