import { useMemo, useRef } from 'react';
import { useEvent } from 'react-use';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CuboidCollider,
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
} from '@react-three/rapier';
import first from 'lodash/first';
import * as THREE from 'three';

import { getState, setState } from '../../store/store';
import { GLTFResult, PlayerStatus } from '../../types';

type PositionTuple = [number, number, number];

interface Props {
  initialPosition: PositionTuple;
  objName: 'mugs' | 'mugs2' | 'ikeaGlass' | 'ikeaMug1' | 'ikeaMug2';
  geometryName: string;
  materialName: string;
  customMaterial?: THREE.Material;
  gltfName: string;
  itemsNumber?: number;
  rowModifier?: number;
}

const zCamVec = new THREE.Vector3();
const rotationDirection = new THREE.Vector3();
const bodyEuler = new THREE.Euler();
const bodyRotation = new THREE.Quaternion();

export function Mugs({
  initialPosition,
  objName,
  geometryName,
  materialName,
  customMaterial,
  gltfName,
  itemsNumber = 10,
  rowModifier = 5,
}: Props): JSX.Element {
  const instances = useMemo<InstancedRigidBodyProps[]>(
    () =>
      Array.from({ length: itemsNumber }, (_, idx) => {
        const gridIdx = Math.floor(idx / rowModifier);
        const x = idx - gridIdx * rowModifier;

        return {
          key: `${objName}-${idx}`,
          position: [
            initialPosition[0] + x * 0.11,
            initialPosition[1] + 0.2,
            initialPosition[2] + gridIdx * 0.13,
          ],
          rotation: [0, Math.random() * 3, 0],
        };
      }),
    [initialPosition, itemsNumber, objName, rowModifier]
  );
  const camera = useThree((state) => state.camera);
  const raycaster = useThree((state) => state.raycaster);
  const scene = useThree((state) => state.scene);
  const instanceId = useRef<number | undefined>(undefined);
  const bodiesRef = useRef<(RapierRigidBody | null)[] | null>(null);

  const { nodes, materials } = useGLTF(gltfName) as unknown as GLTFResult;

  useEvent('click', async (event: Event) => {
    event.stopPropagation();

    const { playerStatus } = getState();

    if (playerStatus === null) {
      const y = scene.getObjectByName('mug');
      const x = raycaster.intersectObjects(y?.children || scene.children);

      if (!x[0]) {
        return;
      }

      if (x[0].distance < 2) {
        instanceId.current = x[0].instanceId;
        setState({ playerStatus: PlayerStatus.PICKED });
      }

      return;
    }

    if (
      playerStatus === PlayerStatus.PICKED &&
      instanceId.current !== undefined
    ) {
      const x = raycaster.intersectObjects(
        scene.getObjectByName('bounds')?.children || scene.children
      );

      if (!x[0]) {
        return;
      }
      // console.log((x[0]);

      if (x[0].distance < 2) {
        const { point } = x[0];
        bodiesRef.current?.[instanceId.current]?.setTranslation(
          { x: point.x, y: point.y + 0.2, z: point.z },
          true
        );

        instanceId.current = undefined;
        await new Promise((res) => {
          setTimeout(res);
        });
        setState({ playerStatus: null });
      }
    }
  });

  useEvent('keydown', ({ key }) => {
    if (!key) {
      return;
    }

    if (key === ' ') {
      if (instanceId.current !== undefined) {
        const camPosition = new THREE.Vector3();
        const position = camera.getWorldPosition(camPosition);
        const target = new THREE.Vector3();
        const targetMesh = first(raycaster.intersectObjects(scene.children));

        if (targetMesh) {
          const distance = position.distanceTo(targetMesh.point);
          camera.getWorldDirection(target);
          const { x, y, z } = target.multiplyScalar(Math.min(distance * 2, 10));

          const body = bodiesRef.current?.[instanceId.current];

          body?.setLinvel({ x, y, z }, true);
          body?.setRotation(
            bodyRotation.setFromEuler(
              bodyEuler.set(
                Math.random() * 3,
                Math.random() * 3,
                Math.random() * 3
              )
            ),
            true
          );

          instanceId.current = undefined;
          setState({ playerStatus: null });
        }
      }
    }
  });

  useFrame(() => {
    if (instanceId.current !== undefined) {
      zCamVec.set(0.15, -0.15, -0.4);
      const position = camera.localToWorld(zCamVec);
      camera.getWorldDirection(rotationDirection);
      rotationDirection.normalize();
      const theta = Math.atan2(rotationDirection.x, rotationDirection.z);
      const body = bodiesRef.current?.[instanceId.current];

      body?.setTranslation(position, true);
      body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body?.setRotation(
        bodyRotation.setFromEuler(bodyEuler.set(0, theta + Math.PI, 0)),
        true
      );
    }
  });

  return (
    <group name="mug">
      <InstancedRigidBodies
        ref={bodiesRef}
        instances={instances}
        colliders={false}
        colliderNodes={[
          <CuboidCollider key="mug-collider" args={[0.05, 0.04, 0.05]} />,
        ]}
        type="dynamic"
        mass={20}
        canSleep
      >
        <instancedMesh
          castShadow
          args={[
            nodes[geometryName].geometry,
            customMaterial || materials[materialName],
            itemsNumber,
          ]}
          name={`${objName}`}
        />
      </InstancedRigidBodies>
    </group>
  );
}
