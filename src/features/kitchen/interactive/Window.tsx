import { useEffect, useRef, useState } from 'react';

import { a, useSpring } from '@react-spring/three';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { Mesh } from 'three';

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

  const initialPosition = useRef(position);
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

  const [ref, api] = useBox<Mesh>(() => ({
    type: 'Static',
    position: blockerPosition,
    args: dimensions,
  }));

  useEffect(() => {
    if (windowOpen === 1) {
      const { x, y, z } = position;
      api.position.set(x, y + 5, z);
    } else if (windowOpen === 0) {
      api.position.set(
        initialPosition.current.x,
        initialPosition.current.y,
        initialPosition.current.z
      );
    }
  }, [api.position, position, windowOpen]);

  const { addAchievement } = useAchievement();

  return (
    <group dispose={null}>
      <mesh ref={ref} geometry={geometry} scale={scale}>
        <meshBasicMaterial visible={false} />
      </mesh>
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
