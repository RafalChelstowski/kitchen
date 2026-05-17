import { useEffect, useRef, useState } from 'react';

import { a, useSpring } from '@react-spring/three';
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';

import { useAchievement } from '../../user/useAchievement';
import { glassMaterial } from '../../../common/materials/materials';
import { AchievementName } from '../../../types';
import { useKitchenGltf } from '../useKitchenGltf';

const { degToRad } = THREE.MathUtils;
type PositionTuple = [number, number, number];

export function InteractiveWindow(): JSX.Element {
  const { nodes, materials, kitchenMaterial } = useKitchenGltf();

  const [windowOpen, toggleWindowOpen] = useState(0);
  const { spring } = useSpring({
    spring: windowOpen,
    config: { mass: 20, tension: 400, friction: 300, precision: 0.0001 },
  });
  const rotation = spring.to([0, 1], [0, degToRad(65)]);

  const { position, geometry, scale } = nodes.window_bound;

  const bodyRef = useRef<RapierRigidBody>(null);
  const initialPosition = useRef<PositionTuple>([
    position.x,
    position.y,
    position.z,
  ]);
  const box = new THREE.Box3().setFromObject(nodes.window_bound);
  const dimensions: PositionTuple = [
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z,
  ];
  const blockerPosition: PositionTuple = [
    position.x,
    position.y,
    position.z,
  ];

  useEffect(() => {
    const targetPosition: PositionTuple =
      windowOpen === 1
        ? [position.x, position.y + 5, position.z]
        : initialPosition.current;

    bodyRef.current?.setNextKinematicTranslation({
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
    });
    bodyRef.current?.setTranslation(
      {
        x: targetPosition[0],
        y: targetPosition[1],
        z: targetPosition[2],
      },
      true
    );
  }, [position, windowOpen]);

  const { addAchievement } = useAchievement();

  return (
    <group dispose={null}>
      <RigidBody
        ref={bodyRef}
        type="kinematicPosition"
        colliders={false}
        position={blockerPosition}
      >
        <CuboidCollider
          args={[
            dimensions[0] / 2,
            dimensions[1] / 2,
            dimensions[2] / 2,
          ]}
        />
        <mesh geometry={geometry} scale={scale}>
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <a.group
        position={[-2.99, 1.57, -5.26]}
        rotation-y={rotation}
        onClick={(e) => {
          e.stopPropagation();
          if (e.distance > 1.5) {
            return;
          }

          toggleWindowOpen(Number(!windowOpen));
          addAchievement(AchievementName.WINDOW);
        }}
      >
        <mesh geometry={nodes.Cylinder002.geometry}>{kitchenMaterial}</mesh>
        <mesh
          geometry={nodes.Cylinder002_1.geometry}
          material={glassMaterial}
        />
        <mesh
          geometry={nodes.Cylinder002_2.geometry}
          material={materials.whiteMaterial}
        />
      </a.group>
    </group>
  );
}
