import { Ref, useMemo, useRef } from 'react';

import { useSpring } from '@react-spring/three';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  DoubleSide,
  InstancedMesh,
  Material,
  Object3D,
} from 'three';

interface SmokeProps {
  isVisible: boolean;
}

export function Smoke({ isVisible }: SmokeProps): JSX.Element {
  const tempObject = useMemo(() => new Object3D(), []);
  const ref = useRef<InstancedMesh>(null);
  const texture = useTexture('/smoke.png');

  const particles = useMemo(() => {
    const cloudParticles = [];
    for (let p = 0; p < 50; p += 1) {
      const positionX = 1.65 + Math.random() * 0.3;
      const positionZ = -5.5 + Math.random() * 0.1;
      const rotationZ = Math.random() * 10 * Math.PI;

      cloudParticles.push({
        positionX,
        positionZ,
        rotationZ,
      });
    }
    return cloudParticles;
  }, []);

  const { posY } = useSpring({
    to: async (next) => {
      if (isVisible) {
        await next({ posY: 1.5 });
      }
    },
    from: {
      posY: 1.07,
    },
    reset: true,
  });

  useFrame(() => {
    if (ref.current) {
      particles.forEach((particle, i) => {
        const { positionX, positionZ, rotationZ } = particle;
        tempObject.position.set(positionX, posY.get() - i * 0.093, positionZ);
        tempObject.rotation.set(0, 0, rotationZ);
        tempObject.updateMatrix();
        ref.current?.setMatrixAt(i, tempObject.matrix);
      });
      particles.forEach((particle) => {
        particle.rotationZ -= 0.001;
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={
        ref as unknown as
          | Ref<InstancedMesh<BufferGeometry, Material | Material[]>>
          | undefined
      }
      args={[undefined, undefined, 15]}
    >
      <planeGeometry args={[0.3, 0.3]} />
      <meshLambertMaterial
        side={DoubleSide}
        map={texture}
        depthWrite={false}
        transparent
        opacity={0.55}
        visible={isVisible}
      />
    </instancedMesh>
  );
}
