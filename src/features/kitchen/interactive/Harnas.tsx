import { useRef, useState } from 'react';
import { useEvent } from 'react-use';

import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import {
  CylinderCollider,
  RapierRigidBody,
  RigidBody,
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
import { createHeldItemPoseHelper } from '../heldItemPose';

type PositionTuple = [number, number, number];

const HIDDEN_POSITION: PositionTuple = [2.85, 5, -3.7];
const INITIAL_POSITION: PositionTuple = [0, 1, 0];
const FRIDGE_POSITION: PositionTuple = [3.0, 0.63, -3.63];
const THROW_FORWARD_SPEED = 13;
const THROW_UPWARD_VELOCITY = 2;
const HARNAS_MASS = 0.35;
const HARNAS_LINEAR_DAMPING = 0.45;
const HARNAS_ANGULAR_DAMPING = 2.5;
const HARNAS_FRICTION = 0.9;
const HARNAS_RESTITUTION = 0.12;
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

function syncHarnasBodyToTransform(
  body: RapierRigidBody,
  position: THREE.Vector3,
  quaternion: THREE.Quaternion
) {
  body.setEnabled(true);
  body.setTranslation({ x: position.x, y: position.y, z: position.z }, true);
  body.setRotation(quaternion, true);
}

export function Harnas(): JSX.Element {
  const raycaster = useThree((state) => state.raycaster);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const { nodes, materials } = useGLTF('/can_uv.gltf') as unknown as GLTFResult;
  const bodyRef = useRef<RapierRigidBody>(null);
  const dummyRef = useRef<THREE.Mesh>(null);
  const heldMeshRef = useRef<THREE.Mesh>(null);
  const heldPoseHelperRef = useRef(createHeldItemPoseHelper());
  const initialRotation = useRef<PositionTuple>([
    Math.random(),
    Math.random(),
    Math.random(),
  ]);
  const { addAchievement } = useAchievement();

  const harnasStatus = useRef<InteractiveObjectStatus | undefined>(
    InteractiveObjectStatus.HIDDEN
  );
  const [isHarnasHeld, setIsHarnasHeld] = useState(false);

  const [initialX, initialY, initialZ] = FRIDGE_POSITION;

  const pickUpHarnas = () => {
    harnasStatus.current = InteractiveObjectStatus.PICKED;
    bodyRef.current?.setEnabled(false);
    setIsHarnasHeld(true);
    setState({ playerStatus: PlayerStatus.PICKED });
  };

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
        pickUpHarnas();
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
        const body = bodyRef.current;

        if (body) {
          syncHarnasBodyToTransform(
            body,
            bodyPosition.set(point.x, point.y + 0.2, point.z),
            bodyRotation.setFromEuler(bodyEuler.set(0, 0, 0))
          );
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }

        harnasStatus.current = undefined;
        setIsHarnasHeld(false);

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

      pickUpHarnas();
    }
  };

  const bodyRotation = new THREE.Quaternion();
  const bodyEuler = new THREE.Euler();
  const bodyPosition = new THREE.Vector3();

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
      const { position, quaternion } = heldPoseHelperRef.current.compute(
        camera,
        [0.15, -0.15, -0.4]
      );
      const heldMesh = heldMeshRef.current;

      if (heldMesh) {
        heldMesh.position.copy(position);
        heldMesh.quaternion.copy(quaternion);
      }
    }
  });

  useEvent('keydown', ({ key }) => {
    if (!key) {
      return;
    }

    if (key === ' ') {
      if (harnasStatus.current === InteractiveObjectStatus.PICKED) {
        const target = new THREE.Vector3();
        const { position, quaternion } = heldPoseHelperRef.current.compute(
          camera,
          [0.15, -0.15, -0.4]
        );

        camera.getWorldDirection(target);
        target.normalize().multiplyScalar(THROW_FORWARD_SPEED);

        bodyRef.current?.setEnabled(true);
        if (bodyRef.current) {
          const heldMesh = heldMeshRef.current;

          syncHarnasBodyToTransform(
            bodyRef.current,
            heldMesh?.getWorldPosition(bodyPosition) ?? position,
            heldMesh?.getWorldQuaternion(bodyRotation) ?? quaternion
          );
        }
        bodyRef.current?.setLinvel(
          {
            x: target.x,
            y: target.y + THROW_UPWARD_VELOCITY,
            z: target.z,
          },
          true
        );
        setState({ playerStatus: null });
        harnasStatus.current = undefined;
        setIsHarnasHeld(false);
      }
    }
  });

  return (
    <>
      <group name="harnas">
        <RigidBody
          ref={bodyRef}
          type="dynamic"
          colliders={false}
          mass={HARNAS_MASS}
          linearDamping={HARNAS_LINEAR_DAMPING}
          angularDamping={HARNAS_ANGULAR_DAMPING}
          canSleep
          position={INITIAL_POSITION}
          rotation={initialRotation.current}
        >
          <CylinderCollider
            args={[0.07, 0.06]}
            friction={HARNAS_FRICTION}
            restitution={HARNAS_RESTITUTION}
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
            visible={!isHarnasHeld}
            scale={0.7}
          />
        </RigidBody>
      </group>
      <mesh
        castShadow
        ref={heldMeshRef}
        name="harnas_held"
        material={materials.harnasblue}
        geometry={nodes.Cylinder.geometry}
        visible={isHarnasHeld}
        raycast={() => undefined}
        scale={0.7}
      />
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
