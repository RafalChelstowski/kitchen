import React, { useLayoutEffect, useRef } from 'react';
import { useEffectOnce, useEvent } from 'react-use';

import { extend, RootState, useFrame, useThree } from '@react-three/fiber';
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
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
const playerRotation = new THREE.Quaternion();

export function Player(): JSX.Element {
  const controlsRef = useRef<ControlsLock>(null);
  const bodyRef = useRef<RapierRigidBody>(null);

  const { setIsLocked } = useStore((state) => ({
    setIsLocked: state.setIsLocked,
  }));

  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const setEvents = useThree((state) => state.setEvents);
  const get = useThree((state) => state.get);
  useControls();

  useLayoutEffect(() => {
    if (!controlsRef.current?.isLocked) {
      camera.position.set(0, 1.5, 0);
      camera.lookAt(-3, 1, -8);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

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
      setIsLocked(document.pointerLockElement === gl.domElement);
    },
    document
  );

  useFrame((state) => {
    const { controlsDown, controlsUp, controlsLeft, controlsRight } =
      useControlsStore.getState();
    const isMoving =
      controlsUp || controlsDown || controlsLeft || controlsRight;

    const body = bodyRef.current;
    if (body && controlsRef.current?.isLocked) {
      body.setAdditionalMass(3, true);
      const position = body.translation();
      const velocity = body.linvel();
      state.camera.position.copy(
        cameraPosition.set(
          position.x,
          position.y > 0.65 ? position.y + 0.4 : position.y + 0.9,
          position.z
        )
      );
      frontVector.set(0, 0, Number(controlsDown) - Number(controlsUp));
      sideVector.set(Number(controlsLeft) - Number(controlsRight), 0, 0);
      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(SPEED)
        .applyEuler(camera.rotation);

      body.setLinvel(
        {
          x: direction.x,
          y: position.y > 0.65 && isMoving ? -1 : velocity.y,
          z: direction.z,
        },
        true
      );
      body.setRotation(playerRotation, true);
    } else {
      body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body?.setRotation(playerRotation, true);
      body?.setAdditionalMass(0, true);
    }
  });

  return (
    <>
      <pointerLockControls
        args={[camera, gl.domElement]}
        ref={controlsRef}
        pointerSpeed={3.5}
      />
      <RigidBody
        ref={bodyRef}
        type="dynamic"
        colliders={false}
        position={INITIAL_POSITION}
        mass={0}
        lockRotations
      >
        <CuboidCollider args={[0.025, 0.6, 0.025]} />
        <mesh />
      </RigidBody>
    </>
  );
}
