import { useRef } from 'react';
import { useEvent } from 'react-use';

import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { degToRad } from 'three/src/math/MathUtils';

import { getState, setState } from '../../../store/store';
import { InteractiveObjectStatus, PlayerStatus } from '../../../types';

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.Material>;
};

const HIDDEN_POSITION = [2.85, 5, -3.7];
const FRIDGE_POSITION = [3.0, 0.63, -3.63];

export function Harnas(): JSX.Element {
  const raycaster = useThree((state) => state.raycaster);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const { nodes, materials } = useGLTF('/can_uv.gltf') as unknown as GLTFResult;
  const dummyRef = useRef<Mesh>(null);
  const [ref, api] = useCylinder<Mesh>(() => ({
    mass: 1,
    args: [0.05, 0.05, 0.14, 12],
    position: [0, 1, 0],
    rotation: [Math.random(), Math.random(), Math.random()],
    allowSleep: false,
  }));

  const harnasStatus = useRef<InteractiveObjectStatus | undefined>(
    InteractiveObjectStatus.HIDDEN
  );

  const [initialX, initialY, initialZ] = FRIDGE_POSITION;

  useEvent('click', () => {
    const { playerStatus } = getState();

    const x = raycaster
      .intersectObjects(scene.children)
      .filter(
        (o) =>
          o.object.name.includes('harnas_real') ||
          o.object.name.includes('area')
      )?.[0];

    if (x?.object.name.includes('harnas_real')) {
      if (playerStatus === PlayerStatus.PICKED) {
        return;
      }
      if (x.distance < 2) {
        harnasStatus.current = InteractiveObjectStatus.PICKED;
        setState({ playerStatus: PlayerStatus.PICKED });

        return;
      }
    }

    if (
      harnasStatus.current === InteractiveObjectStatus.PICKED &&
      x &&
      x.distance < 2
    ) {
      const { point } = x;
      api.position.set(point.x, point.y + 0.2, point.z);
      harnasStatus.current = undefined;
      setState({ playerStatus: null });
    }
  });

  const handleDummyHarnasClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (dummyRef.current) {
      dummyRef.current.position.set(0, 10, 0);

      harnasStatus.current = InteractiveObjectStatus.PICKED;
      setState({ playerStatus: PlayerStatus.PICKED });
    }
  };

  const zCamVec = new THREE.Vector3();
  const rotationDirection = new THREE.Vector3();

  useFrame(() => {
    if (harnasStatus.current === InteractiveObjectStatus.HIDDEN) {
      const [hiddenX, hiddenY, hiddenZ] = HIDDEN_POSITION;
      api.position.set(hiddenX, hiddenY, hiddenZ);
      api.velocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0);
    }

    if (harnasStatus.current === InteractiveObjectStatus.PICKED) {
      zCamVec.set(0.15, -0.15, -0.4);
      const position = camera.localToWorld(zCamVec);
      camera.getWorldDirection(rotationDirection);
      rotationDirection.normalize();
      const theta = Math.atan2(rotationDirection.x, rotationDirection.z);

      api.position.set(position.x, position.y, position.z);
      api.velocity.set(0, 0, 0);
      api.rotation.set(0, theta + Math.PI, 0);
    }
  });

  useEvent('keydown', ({ key }) => {
    if (!key) {
      return;
    }

    if (key === ' ') {
      if (harnasStatus.current === InteractiveObjectStatus.PICKED) {
        const camPosition = new THREE.Vector3();
        const position = camera.getWorldPosition(camPosition);
        const target = new THREE.Vector3();
        const targetMesh = raycaster.intersectObjects(scene.children)?.[0];

        if (targetMesh) {
          const distance = position.distanceTo(targetMesh.point);
          camera.getWorldDirection(target);
          const { x, y, z } = target.multiplyScalar(Math.min(distance * 2, 15));

          api.velocity.set(x, y, z);
          api.rotation.set(
            Math.random() * 3,
            Math.random() * 3,
            Math.random() * 3
          );
          setState({ playerStatus: null });
          harnasStatus.current = undefined;
        }
      }
    }
  });

  return (
    <>
      <mesh
        ref={ref}
        name="harnas_real"
        material={materials.harnasblue}
        geometry={nodes.Cylinder.geometry}
        scale={0.7}
      />
      <mesh
        ref={dummyRef}
        name="harnas_dummy"
        rotation={[0, degToRad(222), 0]}
        position={[initialX, initialY, initialZ]}
        material={materials.harnasblue}
        geometry={nodes.Cylinder.geometry}
        onClick={handleDummyHarnasClick}
        scale={0.7}
      />
    </>
  );
}