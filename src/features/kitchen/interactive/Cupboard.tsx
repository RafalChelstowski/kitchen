import { useState } from 'react';

import { a, useSpring } from '@react-spring/three';
import { MathUtils } from 'three';

import { useKitchenGltf } from '../useKitchenGltf';

const { degToRad } = MathUtils;

export function Cupboard(): JSX.Element {
  const { nodes, materials, kitchenMaterial } = useKitchenGltf();

  const [cupboardOpen, toggleCupboardOpen] = useState(0);

  const { spring } = useSpring({
    spring: cupboardOpen,
    config: { mass: 20, tension: 400, friction: 300, precision: 0.0001 },
  });

  const rotation = spring.to([0, 1], [0, degToRad(65)]);

  return (
    <>
      <a.group
        position={[-0.31, 0.43, -3.92]}
        rotation-y={rotation}
        onClick={(e) => {
          e.stopPropagation();
          if (e.distance > 2) {
            return;
          }

          toggleCupboardOpen(Number(!cupboardOpen));
        }}
      >
        <mesh geometry={nodes.Cube162.geometry}>{kitchenMaterial}</mesh>
        <mesh
          geometry={nodes.Cube162_1.geometry}
          material={materials.woodMaterial}
        />
      </a.group>
      <mesh
        geometry={nodes.cupboard.geometry}
        material={nodes.cupboard.material}
        position={nodes.cupboard.position}
      />
    </>
  );
}
