import { useState } from 'react';

import { a, useSpring } from '@react-spring/three';
import { MathUtils } from 'three';

import { useKitchenGltf } from '../useKitchenGltf';

const { degToRad } = MathUtils;

export function Microwave(): JSX.Element {
  const { nodes, materials, kitchenMaterial } = useKitchenGltf();

  const [microwaveOpen, toggleMicrowaveOpen] = useState(0);
  const { spring } = useSpring({
    spring: microwaveOpen,
    config: { mass: 20, tension: 400, friction: 300, precision: 0.0001 },
  });
  const rotation = spring.to([0, 1], [0, degToRad(-83)]);

  return (
    <>
      <group position={[-2.76, 0.85, -3.42]}>
        <mesh geometry={nodes.Cube192.geometry}>{kitchenMaterial}</mesh>
        <mesh
          geometry={nodes.Cube192_1.geometry}
          material={materials.steelMaterial}
        />
      </group>
      <a.group
        position={[-2.69, 0.86, -3.2]}
        rotation-y={rotation}
        onClick={(e) => {
          e.stopPropagation();
          if (e.distance > 1.5) {
            return;
          }

          toggleMicrowaveOpen(Number(!microwaveOpen));
        }}
      >
        <mesh geometry={nodes.Cube193.geometry}>{kitchenMaterial}</mesh>
        <mesh
          geometry={nodes.Cube193_1.geometry}
          material={materials.blackPlasticMaterial}
        />
      </a.group>
    </>
  );
}
