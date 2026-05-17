import { useMemo, useRef, useState } from 'react';
import { useEvent } from 'react-use';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
  useRapier,
} from '@react-three/rapier';
import first from 'lodash/first';
import * as THREE from 'three';

import { getState, setState } from '../../store/store';
import { GLTFResult, PlayerStatus } from '../../types';
import { createHeldItemPoseHelper } from './heldItemPose';

type PositionTuple = [number, number, number];
type RotationTuple = [number, number, number];
type MugBodyType = 'dynamic' | 'kinematicPosition';

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

function setNextMugTransform(
  body: RapierRigidBody,
  position: THREE.Vector3,
  rotationY: number
) {
  body.setNextKinematicTranslation(position);
  body.setNextKinematicRotation(
    bodyRotation.setFromEuler(bodyEuler.set(0, rotationY, 0))
  );
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
  const { rapier } = useRapier();
  const instanceId = useRef<number | undefined>(undefined);
  const bodiesRef = useRef<(RapierRigidBody | null)[]>([]);
  const heldPoseHelperRef = useRef(createHeldItemPoseHelper());
  const [bodyTypes, setBodyTypes] = useState<MugBodyType[]>(() =>
    Array.from({ length: itemsNumber }, () => 'dynamic')
  );

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
          setBodyTypes((current) =>
            current.map((bodyType, idx) =>
              idx === mugIndex ? 'kinematicPosition' : bodyType
            )
          );
          bodiesRef.current[mugIndex]?.setBodyType(
            rapier.RigidBodyType.KinematicPositionBased,
            true
          );
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

        setBodyTypes((current) =>
          current.map((bodyType, idx) =>
            idx === selectedMugIndex ? 'dynamic' : bodyType
          )
        );
        body?.setBodyType(rapier.RigidBodyType.Dynamic, true);
        body?.setTranslation({ x: point.x, y: point.y + 0.2, z: point.z }, true);
        body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body?.setAngvel({ x: 0, y: 0, z: 0 }, true);

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

          const selectedMugIndex = instanceId.current;
          const body = bodiesRef.current?.[selectedMugIndex];

          setBodyTypes((current) =>
            current.map((bodyType, idx) =>
              idx === selectedMugIndex ? 'dynamic' : bodyType
            )
          );
          body?.setBodyType(rapier.RigidBodyType.Dynamic, true);
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
      const { position, yaw } = heldPoseHelperRef.current.compute(camera, [
        0.15,
        -0.15,
        -0.4,
      ]);
      const body = bodiesRef.current[instanceId.current];

      if (body) {
        setNextMugTransform(body, position, yaw);
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
          type={bodyTypes[idx] ?? 'dynamic'}
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
            userData={{ mugIndex: idx }}
          />
        </RigidBody>
      ))}
    </group>
  );
}
