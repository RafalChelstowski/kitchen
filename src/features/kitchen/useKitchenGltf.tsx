import { useMemo } from 'react';

import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { GLTFResult } from '../../types';

export type UseKitchenGltf = Pick<GLTFResult, 'nodes' | 'materials'> & {
  kitchenMaterial: JSX.Element;
};

export function useKitchenGltf(): UseKitchenGltf {
  const { nodes, materials } = useGLTF(
    '/kitchen_interactives.gltf'
  ) as unknown as GLTFResult;
  const texture = useTexture('/elements.jpg');
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  const normalMap = useTexture('/elements_normal.jpg');
  normalMap.flipY = false;
  normalMap.colorSpace = THREE.NoColorSpace;

  const metalMap = useTexture('/elements_metalness.jpg');
  metalMap.flipY = false;
  metalMap.colorSpace = THREE.NoColorSpace;

  const roughnessMap = useTexture('/elements_roughness.jpg');
  roughnessMap.flipY = false;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const kitchenMaterial = useMemo(
    () => (
      <meshPhysicalMaterial
        map={texture}
        normalMap={normalMap}
        metalnessMap={metalMap}
        roughnessMap={roughnessMap}
      />
    ),
    [metalMap, normalMap, roughnessMap, texture]
  );

  const memo = useMemo(
    () => ({ nodes, materials, kitchenMaterial }),
    [kitchenMaterial, materials, nodes]
  );

  return memo;
}

useGLTF.preload('/kitchen_interactives.gltf');
