import * as THREE from 'three';

import { useControlsStore } from '../../common/hooks/useControls';
import { createMockRapierBody, createRapierMocks, render3D } from '../../test';
type FrameState = {
  camera: THREE.Camera;
};

type FrameCallback = (state: FrameState, delta: number) => void;

test('moves a locked player with camera-relative physics and camera follow', async () => {
  const body = createMockRapierBody({
    linearVelocity: { x: 0, y: 0.75, z: 0 },
    translation: { x: 2, y: 1.2, z: -4 },
  });
  let bodyProps: Record<string, unknown> | undefined;
  const rapierMocks = createRapierMocks({
    bodyFactory: (props) => {
      bodyProps = props;
      return body;
    },
  });
  const frameCallbacks: FrameCallback[] = [];
  const camera = new THREE.PerspectiveCamera();
  camera.rotation.set(0, Math.PI / 2, 0);
  const domElement = document.createElement('canvas');
  const oldCompute = vi.fn();
  const setEvents = vi.fn();
  const get = vi.fn(() => ({
    events: { compute: oldCompute },
  }));
  const threeState = {
    camera,
    get,
    gl: { domElement },
    setEvents,
  };

  class MockPointerLockControls {
    isLocked = true;
    pointerSpeed = 0;

    constructor(
      public readonly camera: THREE.Camera,
      public readonly domElement: HTMLCanvasElement
    ) {}

    getDirection(target: THREE.Vector3): THREE.Vector3 {
      return target;
    }

    lock = vi.fn();
  }

  vi.doMock('@react-three/fiber', async () => {
    const actual = await vi.importActual<typeof import('@react-three/fiber')>(
      '@react-three/fiber'
    );

    return {
      ...actual,
      useFrame: (callback: FrameCallback) => {
        frameCallbacks.push(callback);
      },
      useThree: <T,>(selector: (state: typeof threeState) => T): T =>
        selector(threeState),
    };
  });
  vi.doMock('@react-three/rapier', () => rapierMocks);
  vi.doMock('three/examples/jsm/controls/PointerLockControls.js', () => ({
    PointerLockControls: MockPointerLockControls,
  }));

  const { Player } = await import('./Player');
  useControlsStore.setState({
    controlsDown: false,
    controlsLeft: false,
    controlsRight: false,
    controlsUp: true,
  });

  const renderer = await render3D(<Player />);
  expect(frameCallbacks).toHaveLength(1);
  expect(bodyProps).toMatchObject({
    colliders: false,
    lockRotations: true,
    mass: 0,
    position: [0, 0.2, 1],
    type: 'dynamic',
  });

  frameCallbacks[0]({ camera }, 1 / 60);

  expect(body.state.additionalMass).toBe(3);
  expect(body.state.linearVelocity.x).toBeCloseTo(-3.5);
  expect(body.state.linearVelocity.y).toBe(-1);
  expect(body.state.linearVelocity.z).toBeCloseTo(0);
  expect(camera.position.toArray()).toEqual([2, 1.6, -4]);
  expect(body.state.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  expect(body.calls).toContainEqual({
    args: [3, true],
    method: 'setAdditionalMass',
  });
  const rotationCall = body.calls.find(
    (call) => call.method === 'setRotation'
  );
  expect(rotationCall?.args[1]).toBe(true);
  expect(rotationCall?.args[0]).toMatchObject({
    w: 1,
    x: 0,
    y: 0,
    z: 0,
  });

  body.state.translation.y = 0.4;
  body.state.linearVelocity.y = 0.75;
  useControlsStore.setState({ controlsUp: false });

  frameCallbacks[0]({ camera }, 1 / 60);

  expect(body.state.linearVelocity).toEqual({ x: 0, y: 0.75, z: 0 });
  expect(camera.position.toArray()).toEqual([2, 1.3, -4]);

  await renderer.unmount();
});
