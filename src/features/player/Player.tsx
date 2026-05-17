import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useEffectOnce, useEvent } from 'react-use';

import { useBox } from '@react-three/cannon';
import { extend, RootState, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import { useControls, useControlsStore } from '../../common/hooks/useControls';
import { useStore } from '../../store/store';
import { ControlsLock } from '../../types';

extend({ PointerLockControls });

type PositionTuple = [number, number, number];

const INITIAL_POSITION: PositionTuple = [0, 0.2, 1];
const SPEED = 3.5;

const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();

export function Player(): JSX.Element {
  const controlsRef = useRef<ControlsLock>(null);
  const velocityRef = useRef([0, 0, 0]);

  const { toggleIsLocked } = useStore((state) => ({
    toggleIsLocked: state.toggleIsLocked,
  }));

  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const setEvents = useThree((state) => state.setEvents);
  const get = useThree((state) => state.get);
  useControls();

  const [ref, api] = useBox<Mesh>(() => ({
    args: [0.05, 1.2, 0.05],
    mass: 0,
    type: 'Dynamic',
    position: INITIAL_POSITION,
  }));

  useLayoutEffect(() => {
    if (!controlsRef.current?.isLocked) {
      camera.position.set(0, 1.5, 0);
      camera.lookAt(-3, 1, -8);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useEffect(() => {
    if (controlsRef.current?.isLocked) {
      api.velocity.subscribe((v) => {
        velocityRef.current = v;
      });
    }
  }, [api.velocity, api.position]);

  useEffectOnce(() => {
    const oldComputeOffsets = get().events.compute;
    setEvents({
      compute(_, state: RootState) {
        const offsetX = state.size.width / 2;
        const offsetY = state.size.height / 2;
        state.pointer.set(
          (offsetX / state.size.width) * 2 - 1,
          -(offsetY / state.size.height) * 2 + 1
        );
        state.raycaster.setFromCamera(state.pointer, state.camera);
      },
    });

    return () => {
      setEvents({ compute: oldComputeOffsets });
    };
  });

  useEvent('click', (e) => {
    if (e.target.name === 'Play') {
      controlsRef.current?.lock();
    }
  });

  useEvent(
    'pointerlockchange',
    () => {
      toggleIsLocked();
    },
    document
  );

  useFrame((state) => {
    const { controlsDown, controlsUp, controlsLeft, controlsRight } =
      useControlsStore.getState();
    const isMoving =
      controlsUp || controlsDown || controlsLeft || controlsRight;

    if (ref.current && controlsRef.current?.isLocked) {
      api.mass.set(3);
      state.camera.position.copy(
        cameraPosition.set(
          ref.current.position.x,
          ref.current.position.y > 0.65
            ? ref.current.position.y + 0.4
            : ref.current.position.y + 0.9,
          ref.current.position.z
        )
      );
      frontVector.set(0, 0, Number(controlsDown) - Number(controlsUp));
      sideVector.set(Number(controlsLeft) - Number(controlsRight), 0, 0);
      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(SPEED)
        .applyEuler(camera.rotation);

      api.velocity.set(
        direction.x,
        ref.current.position.y > 0.65 && isMoving ? -1 : velocityRef.current[1],
        direction.z
      );
      api.rotation.set(0, 0, 0);

      ref.current.getWorldPosition(ref.current.position);
    } else {
      api.velocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0);
      api.mass.set(0);
    }
  });

  return (
    <>
      <pointerLockControls
        args={[camera, gl.domElement]}
        ref={controlsRef}
        pointerSpeed={0.2}
      />
      <mesh ref={ref} />
    </>
  );
}
