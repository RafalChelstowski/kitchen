import { useGLTF } from '@react-three/drei';
import {
  CuboidCollider,
  CylinderCollider,
  RigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';

import { GLTFResult } from '../../types';

const tBox = new THREE.Box3();
const material = new THREE.MeshBasicMaterial({ visible: false });
type PositionTuple = [number, number, number];
const HARD_SURFACE_FRICTION = 0.85;
const HARD_SURFACE_RESTITUTION = 0.05;

function CubeBoundary({ mesh }: { mesh: THREE.Mesh }) {
  const { position, geometry, scale, rotation } = mesh;
  const box = tBox.setFromObject(mesh);
  const dimensions: PositionTuple = [
    rotation.y === 0 ? box.max.x - box.min.x : (box.max.x - box.min.x) / 2,
    box.max.y - box.min.y,
    box.max.z - box.min.z,
  ];

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[...position.toArray()]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <CuboidCollider
        args={[
          dimensions[0] / 2,
          dimensions[1] / 2,
          dimensions[2] / 2,
        ]}
        friction={HARD_SURFACE_FRICTION}
        restitution={HARD_SURFACE_RESTITUTION}
      />
      <mesh
        name="static-cube"
        geometry={geometry}
        material={material}
        scale={scale}
      />
    </RigidBody>
  );
}

function CylinderBoundary({ mesh }: { mesh: THREE.Mesh }) {
  const box = tBox.setFromObject(mesh);
  const radius = (box.max.x - box.min.x) / 2;
  const height = box.max.y - box.min.y;
  const { position, geometry, scale } = mesh;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[...position.toArray()]}
    >
      <CylinderCollider
        args={[height / 2, radius]}
        friction={HARD_SURFACE_FRICTION}
        restitution={HARD_SURFACE_RESTITUTION}
      />
      <mesh
        name="static-cylinder"
        geometry={geometry}
        material={material}
        scale={scale}
      />
    </RigidBody>
  );
}

export function StaticBounds(): JSX.Element {
  const { nodes } = useGLTF('/bounds.gltf') as unknown as GLTFResult;

  const meshes = Object.entries(nodes)
    .filter((mesh) => mesh[1].type === 'Mesh')
    .map((node) => {
      const [key, mesh] = node;

      if (mesh.name.includes('Cube')) {
        return <CubeBoundary key={key} mesh={mesh} />;
      }

      if (mesh.name.includes('Cylinder')) {
        return <CylinderBoundary key={key} mesh={mesh} />;
      }

      return null;
    });

  return <group name="bounds">{meshes}</group>;
}

useGLTF.preload('/bounds.gltf');
