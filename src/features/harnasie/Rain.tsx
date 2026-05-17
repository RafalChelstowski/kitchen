import { useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  CylinderCollider,
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
} from '@react-three/rapier';
import { InstancedMesh } from 'three';

import { GLTFResult } from '../../types';

export function Rain({ num }: { num: number }): JSX.Element {
  const { nodes, materials } = useGLTF('/can_uv.gltf') as unknown as GLTFResult;
  const instances = useMemo<InstancedRigidBodyProps[]>(
    () =>
      Array.from({ length: num }, (_, idx) => ({
        key: `rain-can-${idx}`,
        position: [0, 30 * Math.random(), 0],
        rotation: [Math.random(), Math.random(), Math.random()],
      })),
    [num]
  );
  const ref = useRef<InstancedMesh>(null);
  const bodiesRef = useRef<(RapierRigidBody | null)[] | null>(null);

  const prevTime = useRef(0);
  const currentTime = useRef<number | undefined>(undefined);

  useFrame(({ clock }) => {
    currentTime.current = clock.getElapsedTime();

    if (currentTime.current - prevTime.current > 0.4) {
      bodiesRef.current?.[Math.floor(Math.random() * num)]?.setTranslation(
        { x: 0, y: 30 + Math.random() * 2, z: 0 },
        true
      );
      prevTime.current = clock.getElapsedTime();
    }
  });

  return (
    <group>
      <InstancedRigidBodies
        ref={bodiesRef}
        instances={instances}
        colliders={false}
        colliderNodes={[
          <CylinderCollider key="rain-can-collider" args={[0.09, 0.08]} />,
        ]}
        type="dynamic"
        mass={1}
        canSleep={false}
      >
        <instancedMesh
          ref={ref}
          name="Can"
          args={[nodes.Cylinder.geometry, materials.harnasblue, num]}
          castShadow
        />
      </InstancedRigidBodies>
    </group>
  );
}
