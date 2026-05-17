import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

import { GLTFResult } from '../../types';

const tBox = new THREE.Box3();
const material = new THREE.MeshBasicMaterial({ visible: false });
type PositionTuple = [number, number, number];

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

  const [ref] = useCylinder<THREE.Mesh>(() => ({
    type: 'Static',
    position: [...position.toArray()],
    args: [radius, radius, height, 16],
  }));

  return (
    <mesh
      name="static-cylinder"
      ref={ref}
      geometry={geometry}
      material={material}
      scale={scale}
    />
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
