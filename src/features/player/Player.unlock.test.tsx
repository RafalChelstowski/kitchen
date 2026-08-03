import * as THREE from 'three';

import { useControlsStore } from '../../common/hooks/useControls';
import { initialState, getState, setState } from '../../store/store';
import {
  createMockRapierBody,
  createRapierMocks,
  render3D,
} from '../../test';

type FrameState = {
  camera: THREE.Camera;
};

type FrameCallback = (state: FrameState, delta: number) => void;

const emptyControls = {
  controlsDown: false,
  controlsLeft: false,
  controlsRight: false,
  controlsUp: false,
};

test('resets an unlocked player body and tracks renderer pointer lock changes', async () => {
  const body = createMockRapierBody({
    additionalMass: 4,
    linearVelocity: { x: 1, y: -2, z: 3 },
    rotation: { x: 0.2, y: 0.3, z: 0.4, w: 0.8 },
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
    isLocked = false;
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

  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
    isLocked: false,
  });
  useControlsStore.setState(emptyControls);

  const { Player } = await import('./Player');
  const pointerLockElementDescriptor = Object.getOwnPropertyDescriptor(
    document,
    'pointerLockElement'
  );
  Object.defineProperty(document, 'pointerLockElement', {
    configurable: true,
    value: null,
  });

  const renderer = await render3D(<Player />);

  try {
    expect(bodyProps).toMatchObject({
      colliders: false,
      lockRotations: true,
      mass: 0,
      position: [0, 0.2, 1],
      type: 'dynamic',
    });
    expect(frameCallbacks).toHaveLength(1);

    frameCallbacks[0]({ camera }, 1 / 60);

    expect(body.state.linearVelocity).toEqual({ x: 0, y: 0, z: 0 });
    expect(body.state.additionalMass).toBe(0);
    expect(body.state.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 });

    const otherElement = document.createElement('canvas');
    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: otherElement,
    });
    document.dispatchEvent(new Event('pointerlockchange'));
    expect(getState().isLocked).toBe(false);

    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: domElement,
    });
    document.dispatchEvent(new Event('pointerlockchange'));
    expect(getState().isLocked).toBe(true);

    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: null,
    });
    document.dispatchEvent(new Event('pointerlockchange'));
    expect(getState().isLocked).toBe(false);
  } finally {
    await renderer.unmount();

    if (pointerLockElementDescriptor) {
      Object.defineProperty(
        document,
        'pointerLockElement',
        pointerLockElementDescriptor
      );
    } else {
      Reflect.deleteProperty(document, 'pointerLockElement');
    }
  }
});
