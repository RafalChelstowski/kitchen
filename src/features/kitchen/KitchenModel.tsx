import { Suspense } from 'react';

import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import { useStore } from '../../store/store';
import { Express } from './interactive/Express';
import { Fridge } from './interactive/Fridge';

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, unknown>;
};

type Props = JSX.IntrinsicElements['group'];

export function KitchenModel(props: Props): JSX.Element {
  const texture = useTexture('/elements.jpg');
  texture.flipY = false;
  texture.encoding = THREE.sRGBEncoding;
  // const normalMap = useTexture('/elements_normal.jpg');
  // normalMap.flipY = false;

  // const metalMap = useTexture('/elements_metalness.jpg');
  // metalMap.flipY = false;

  // const roughnessMap = useTexture('/elements_roughness.jpg');
  // roughnessMap.flipY = false;

  const { nodes } = useGLTF('/kitchen.gltf') as GLTFResult;

  const meshes = Object.entries(nodes)
    .filter(
      (mesh) => mesh[1].type === 'Mesh' && !mesh[1].name.includes('interactive')
    )
    .map((node) => {
      const [key, mesh] = node;
      return (
        <mesh
          key={key}
          position={mesh.position}
          rotation={mesh.rotation}
          geometry={mesh.geometry}
          scale={mesh.scale}
          name={mesh.name}
          onClick={(e) => {
            e.stopPropagation();

            if (e.distance > 1.5) {
              return;
            }

            useStore.setState({ clickedPoint: e.point });
          }}
        >
          <Suspense fallback={<meshStandardMaterial />}>
            <meshStandardMaterial
              map={texture}
              // normalMap={normalMap}
              // metalnessMap={metalMap}
              // normalScale={new THREE.Vector2(1, 1)}
              // roughnessMap={roughnessMap}
            />
          </Suspense>
        </mesh>
      );
    });

  return (
    <group {...props} dispose={null}>
      <Suspense fallback={null}>
        <>
          {meshes}
          <Fridge />
          <Express />
        </>
      </Suspense>
    </group>
  );
}