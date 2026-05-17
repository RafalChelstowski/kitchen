import { useRef, useState } from 'react';
import { useEvent } from 'react-use';

import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import {
  CylinderCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from '@react-three/rapier';
import * as THREE from 'three';

import { useAchievement } from '../../user/useAchievement';
import { getState, setState } from '../../../store/store';
import {
  AchievementName,
  GLTFResult,
  InteractiveObjectStatus,
  PlayerStatus,
} from '../../../types';

type PositionTuple = [number, number, number];
type HarnasBodyType = 'dynamic' | 'kinematicPosition';

const HIDDEN_POSITION: PositionTuple = [2.85, 5, -3.7];
const INITIAL_POSITION: PositionTuple = [0, 1, 0];
const FRIDGE_POSITION: PositionTuple = [3.0, 0.63, -3.63];
const THROW_FORWARD_SPEED = 13;
const THROW_UPWARD_VELOCITY = 2;
const { degToRad } = THREE.MathUtils;

function objectOrParentHasName(
  object: THREE.Object3D | undefined,
  name: string
) {
  let current = object;

  while (current) {
    if (current.name === name) {
      return true;
    }

    current = current.parent ?? undefined;
  }

  return false;
}

function setNextHarnasTransform(
  body: RapierRigidBody,
  quaternion: THREE.Quaternion,
  euler: THREE.Euler,
  position: PositionTuple,
  rotation: PositionTuple
) {
  const [x, y, z] = position;
  const [rX, rY, rZ] = rotation;

  body.setNextKinematicTranslation({ x, y, z });
  body.setNextKinematicRotation(
    quaternion.setFromEuler(euler.set(rX, rY, rZ))
  );
}

export function Harnas(): JSX.Element {
  const raycaster = useThree((state) => state.raycaster);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const { rapier } = useRapier();
  const { nodes, materials } = useGLTF('/can_uv.gltf') as unknown as GLTFResult;
  const bodyRef = useRef<RapierRigidBody>(null);
  const dummyRef = useRef<THREE.Mesh>(null);
  const initialRotation = useRef<PositionTuple>([
    Math.random(),
    Math.random(),
    Math.random(),
  ]);
  const { addAchievement } = useAchievement();

  const harnasStatus = useRef<InteractiveObjectStatus | undefined>(
    InteractiveObjectStatus.HIDDEN
  );
  const [harnasBodyType, setHarnasBodyType] =
    useState<HarnasBodyType>('dynamic');

  const [initialX, initialY, initialZ] = FRIDGE_POSITION;

  useEvent('click', async (event: Event) => {
    event.stopPropagation();

    const { playerStatus } = getState();

    if (playerStatus === null) {
      const x = raycaster.intersectObjects(
        scene.getObjectByName('harnas')?.children || []
      );

      if (!x[0]) {
        return;
      }

      if (x[0].distance < 2) {
        harnasStatus.current = InteractiveObjectStatus.PICKED;
        setHarnasBodyType('kinematicPosition');
        bodyRef.current?.setBodyType(
          rapier.RigidBodyType.KinematicPositionBased,
          true
        );
        setState({ playerStatus: PlayerStatus.PICKED });
      }

      return;
    }

    if (
      playerStatus === PlayerStatus.PICKED &&
      harnasStatus.current === InteractiveObjectStatus.PICKED
    ) {
      const x = raycaster.intersectObjects(
        scene.getObjectByName('bounds')?.children || scene.children
      );

      if (!x[0]) {
        return;
      }

      if (x[0].distance < 2) {
        const { point } = x[0];
        setHarnasBodyType('dynamic');
        bodyRef.current?.setBodyType(rapier.RigidBodyType.Dynamic, true);
        bodyRef.current?.setTranslation(
          { x: point.x, y: point.y + 0.2, z: point.z },
          true
        );
        harnasStatus.current = undefined;

        await new Promise((res) => {
          setTimeout(res);
        });

        setState({ playerStatus: null });
      }
    }
  });

  const handleDummyHarnasClick = async (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (dummyRef.current) {
      dummyRef.current.position.set(0, 10, 0);

      await new Promise((res) => {
        setTimeout(res, 20);
      });

      harnasStatus.current = InteractiveObjectStatus.PICKED;
      setHarnasBodyType('kinematicPosition');
      bodyRef.current?.setBodyType(
        rapier.RigidBodyType.KinematicPositionBased,
        true
      );
      setState({ playerStatus: PlayerStatus.PICKED });
    }
  };

  const zCamVec = new THREE.Vector3();
  const rotationDirection = new THREE.Vector3();
  const bodyRotation = new THREE.Quaternion();
  const bodyEuler = new THREE.Euler();

  useFrame(() => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    if (harnasStatus.current === InteractiveObjectStatus.HIDDEN) {
      const [hiddenX, hiddenY, hiddenZ] = HIDDEN_POSITION;
      body.setTranslation({ x: hiddenX, y: hiddenY, z: hiddenZ }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.setRotation(bodyRotation.setFromEuler(bodyEuler.set(0, 0, 0)), true);
    }

    if (harnasStatus.current === InteractiveObjectStatus.PICKED) {
      zCamVec.set(0.15, -0.15, -0.4);
      const position = camera.localToWorld(zCamVec);
      camera.getWorldDirection(rotationDirection);
      rotationDirection.normalize();
      const theta = Math.atan2(rotationDirection.x, rotationDirection.z);

      setNextHarnasTransform(
        body,
        bodyRotation,
        bodyEuler,
        [position.x, position.y, position.z],
        [0, theta + Math.PI, 0]
      );
    }
  });

  useEvent('keydown', ({ key }) => {
    if (!key) {
      return;
    }

    if (key === ' ') {
      if (harnasStatus.current === InteractiveObjectStatus.PICKED) {
        const target = new THREE.Vector3();
        camera.getWorldDirection(target);
        target.normalize().multiplyScalar(THROW_FORWARD_SPEED);

        setHarnasBodyType('dynamic');
        bodyRef.current?.setBodyType(rapier.RigidBodyType.Dynamic, true);
        bodyRef.current?.setLinvel(
          {
            x: target.x,
            y: target.y + THROW_UPWARD_VELOCITY,
            z: target.z,
          },
          true
        );
        bodyRef.current?.setRotation(
          bodyRotation.setFromEuler(
            bodyEuler.set(
              Math.random() * 3,
              Math.random() * 3,
              Math.random() * 3
            )
          ),
          true
        );
        setState({ playerStatus: null });
        harnasStatus.current = undefined;
      }
    }
  });

  return (
    <>
      <group name="harnas">
        <RigidBody
          ref={bodyRef}
          type={harnasBodyType}
          colliders={false}
          mass={1}
          canSleep={false}
          position={INITIAL_POSITION}
          rotation={initialRotation.current}
        >
          <CylinderCollider
            args={[0.07, 0.06]}
            onCollisionEnter={({ other }) => {
              if (
                objectOrParentHasName(other.colliderObject, 'floor') ||
                objectOrParentHasName(other.rigidBodyObject, 'floor')
              ) {
                addAchievement(AchievementName.HARNAS);
              }
            }}
          />
          <mesh
            castShadow
            name="harnas_real"
            material={materials.harnasblue}
            geometry={nodes.Cylinder.geometry}
            scale={0.7}
          />
        </RigidBody>
      </group>
      <mesh
        castShadow
        ref={dummyRef}
        name="harnas_dummy"
        rotation={[0, degToRad(222), 0]}
        position={[initialX, initialY, initialZ]}
        material={materials.harnasblue}
        geometry={nodes.Cylinder.geometry}
        onClick={handleDummyHarnasClick}
        scale={0.7}
      />
    </>
  );
}
