import { useMemo, useRef, useState } from 'react';
import { useEvent } from 'react-use';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
} from '@react-three/rapier';
import first from 'lodash/first';
import * as THREE from 'three';

import { getState, setState } from '../../store/store';
import { GLTFResult, PlayerStatus } from '../../types';
import { createHeldItemPoseHelper } from './heldItemPose';

type PositionTuple = [number, number, number];
type RotationTuple = [number, number, number];

interface MugBodyConfig {
  key: string;
  position: PositionTuple;
  rotation: RotationTuple;
}

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

const bodyEuler = new THREE.Euler();
const bodyRotation = new THREE.Quaternion();
const bodyPosition = new THREE.Vector3();

function syncMugBodyToTransform(
  body: RapierRigidBody,
  position: THREE.Vector3,
  quaternion: THREE.Quaternion
) {
  body.setEnabled(true);
  body.setTranslation({ x: position.x, y: position.y, z: position.z }, true);
  body.setRotation(quaternion, true);
}

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
  const mugs = useMemo<MugBodyConfig[]>(
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
  const bodiesRef = useRef<(RapierRigidBody | null)[]>([]);
  const heldMeshRef = useRef<THREE.Mesh>(null);
  const heldPoseHelperRef = useRef(createHeldItemPoseHelper());
  const [heldMugIndex, setHeldMugIndex] = useState<number | undefined>();

  const { nodes, materials } = useGLTF(gltfName) as unknown as GLTFResult;

  useEvent('click', async (event: Event) => {
    event.stopPropagation();

    const { playerStatus } = getState();

    if (playerStatus === null) {
      const y = scene.getObjectByName('mug');
      const x = raycaster.intersectObjects(
        y?.children || scene.children,
        true
      );

      if (!x[0]) {
        return;
      }

      if (x[0].distance < 2) {
        const mugIndex = x[0].object.userData.mugIndex;

        if (typeof mugIndex === 'number') {
          instanceId.current = mugIndex;
          setHeldMugIndex(mugIndex);
          bodiesRef.current[mugIndex]?.setEnabled(false);
          setState({ playerStatus: PlayerStatus.PICKED });
        }
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
        const selectedMugIndex = instanceId.current;
        const body = bodiesRef.current[selectedMugIndex];

        if (body) {
          syncMugBodyToTransform(
            body,
            bodyPosition.set(point.x, point.y + 0.2, point.z),
            bodyRotation.setFromEuler(bodyEuler.set(0, 0, 0))
          );
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }

        instanceId.current = undefined;
        setHeldMugIndex(undefined);
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

          const selectedMugIndex = instanceId.current;
          const body = bodiesRef.current?.[selectedMugIndex];
          const heldMesh = heldMeshRef.current;

          if (body) {
            const { position, quaternion } = heldPoseHelperRef.current.compute(
              camera,
              [0.15, -0.15, -0.4]
            );

            syncMugBodyToTransform(
              body,
              heldMesh?.getWorldPosition(bodyPosition) ?? position,
              heldMesh?.getWorldQuaternion(bodyRotation) ?? quaternion
            );
            body.setLinvel({ x, y, z }, true);
            body.setAngvel({ x: 0, y: 0, z: 0 }, true);
            body.setRotation(
              bodyRotation.setFromEuler(
                bodyEuler.set(
                  Math.random() * 3,
                  Math.random() * 3,
                  Math.random() * 3
                )
              ),
              true
            );
          }

          instanceId.current = undefined;
          setHeldMugIndex(undefined);
          setState({ playerStatus: null });
        }
      }
    }
  });

  useFrame(() => {
    if (instanceId.current !== undefined) {
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

  return (
    <group name="mug">
      {mugs.map((mug, idx) => (
        <RigidBody
          key={mug.key}
          ref={(body) => {
            bodiesRef.current[idx] = body;
          }}
          colliders={false}
          type="dynamic"
          mass={20}
          canSleep
          position={mug.position}
          rotation={mug.rotation}
        >
          <CuboidCollider args={[0.05, 0.04, 0.05]} />
          <mesh
            castShadow
            geometry={nodes[geometryName].geometry}
            material={customMaterial || materials[materialName]}
            name={`${objName}`}
            visible={heldMugIndex !== idx}
            userData={{ mugIndex: idx }}
          />
        </RigidBody>
      ))}
      <mesh
        castShadow
        ref={heldMeshRef}
        geometry={nodes[geometryName].geometry}
        material={customMaterial || materials[materialName]}
        name={`${objName}_held`}
        visible={heldMugIndex !== undefined}
        raycast={() => undefined}
      />
    </group>
  );
}
