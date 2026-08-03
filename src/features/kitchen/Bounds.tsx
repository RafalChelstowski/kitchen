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

function getLocalDimensions(mesh: THREE.Mesh): PositionTuple {
  mesh.geometry.computeBoundingBox();
  const dimensions = mesh.geometry.boundingBox?.getSize(new THREE.Vector3());

  if (!dimensions) {
    return [0, 0, 0];
  }

  return [
    dimensions.x * Math.abs(mesh.scale.x),
    dimensions.y * Math.abs(mesh.scale.y),
    dimensions.z * Math.abs(mesh.scale.z),
  ];
}

function CubeBoundary({ mesh }: { mesh: THREE.Mesh }) {
  const { position, geometry, scale, rotation } = mesh;
  const dimensions = getLocalDimensions(mesh);

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
        scale={[scale.x, scale.y, scale.z]}
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
        scale={[scale.x, scale.y, scale.z]}
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
