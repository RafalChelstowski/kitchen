import { Suspense } from 'react';

import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, unknown>;
};

type Props = JSX.IntrinsicElements['group'];

export function Env(props: Props): JSX.Element {
  const { nodes } = useGLTF('/env.gltf') as unknown as GLTFResult;

  const meshes = Object.entries(nodes)
    .filter((mesh) => mesh[1].type === 'Mesh')
    .map((node) => {
      const [key, mesh] = node;
      return (
        <mesh
          key={key}
          position={mesh.position}
          rotation={mesh.rotation}
          geometry={mesh.geometry}
          material={mesh.material}
          scale={mesh.scale}
        />
      );
    });

  return (
    <group {...props} dispose={null}>
      <Suspense fallback={null}>{meshes}</Suspense>
    </group>
  );
}
