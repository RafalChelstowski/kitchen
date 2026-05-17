import { useEffect, useRef, useState } from 'react';
import { useEvent } from 'react-use';

import { a, config, useSpring } from '@react-spring/three';
import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { getState, setState, useStore } from '../../../store/store';
import {
  GLTFResult,
  InteractiveObjectStatus,
  PlayerStatus,
} from '../../../types';

type PositionTuple = [number, number, number];

const HIDDEN_POSITION: PositionTuple = [0.2, 5.35, -3.8];
const CUPBOARD_POSITION: PositionTuple = [-0.1, 0.63, -3.8];
const EXPRESS_POSITION: PositionTuple = [1.66, 0.99, -5.43];

export function Transform(): JSX.Element {
  const raycaster = useThree((state) => state.raycaster);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const coffeeState = useStore((state) => state.coffeeState);
  const { nodes: mugNodes, materials: mugMaterials } = useGLTF(
    '/transformMug.gltf'
  ) as unknown as GLTFResult;
  const dummyRef = useRef<THREE.Group>(null);

  const [ref, api] = useCylinder<THREE.Group>(() => ({
    mass: 1,
    args: [0.05, 0.05, 0.1, 12],
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    allowSleep: false,
    onCollide: (e) => {
      if (e.body.position.y < 0.3 && getState().coffeeState === 'ready') {
        setState({ coffeeState: null });
      }
    },
  }));

  const status = useRef<InteractiveObjectStatus | undefined>(
    InteractiveObjectStatus.HIDDEN
  );

  const [transformed, setTransformed] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEvent('click', async (event: Event) => {
    event.stopPropagation();

    if (
      status.current === InteractiveObjectStatus.ANIMATED ||
      getState().coffeeState === 'cupReady' ||
      getState().coffeeState === 'inProgress'
    ) {
      return;
    }

    const { playerStatus } = getState();

    if (playerStatus === null) {
      const x = raycaster.intersectObjects(
        scene.getObjectByName('transform')?.children || []
      );

      if (!x[0]) {
        return;
      }

      if (x[0].distance < 2) {
        status.current = InteractiveObjectStatus.PICKED;
        setState({ playerStatus: PlayerStatus.PICKED });
      }

      return;
    }

    if (
      playerStatus === PlayerStatus.PICKED &&
      status.current === InteractiveObjectStatus.PICKED
    ) {
      const expressSceneObj = scene.getObjectByName('express')?.children || [];
      const x = raycaster.intersectObjects([...expressSceneObj]);

      if (
        x[0] &&
        x[0].distance < 2 &&
        x[0].object.name.includes('express') &&
        getState().coffeeState === 'gripAttached'
      ) {
        status.current = InteractiveObjectStatus.ANIMATED;
        setAnimated(true);

        await new Promise((res) => {
          setTimeout(res);
        });

        setState({ playerStatus: null });

        return;
      }

      const nonInteractiveSceneObj =
        scene.getObjectByName('bounds')?.children || [];
      const y = raycaster.intersectObjects([...nonInteractiveSceneObj]);

      if (
        y[0] &&
        y[0].distance < 2 &&
        y[0].object.name.includes('static') &&
        status.current === InteractiveObjectStatus.PICKED
      ) {
        const { point } = y[0];
        api.position.set(point.x, point.y + 0.2, point.z);
        status.current = undefined;
        // setState({ playerStatus: null });
        api.mass.set(1);

        await new Promise((res) => {
          setTimeout(res);
        });

        setState({ playerStatus: null });
      }
    }
  });

  const handleDummyClick = async (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (dummyRef.current) {
      dummyRef.current.position.set(0, 10, 0);

      await new Promise((res) => {
        setTimeout(res, 20);
      });

      status.current = InteractiveObjectStatus.PICKED;
      setState({ playerStatus: PlayerStatus.PICKED });
    }
  };

  const zCamVec = new THREE.Vector3();
  const rotationDirection = new THREE.Vector3();

  const posRef = useRef([0, 0, 0]);

  useEffect(() => {
    api.position.subscribe((p) => {
      posRef.current = p;
    });
  });

  const { aPosition } = useSpring({
    to: async (next) => {
      if (animated) {
        await next({
          aPosition: [
            EXPRESS_POSITION[0] - 0.15,
            EXPRESS_POSITION[1],
            EXPRESS_POSITION[2],
          ],
          config: config.slow,
        });
        setTransformed(true);
        await next({
          aPosition: [
            EXPRESS_POSITION[0],
            EXPRESS_POSITION[1],
            EXPRESS_POSITION[2],
          ],
        });

        setTransformed(false);
        setAnimated(false);
        status.current = InteractiveObjectStatus.ATTACHED_EXPRESS;
        setState({ playerStatus: null, coffeeState: 'cupReady' });
      }
    },
    from: {
      aPosition: posRef.current,
    },
    reset: true,
  });

  useFrame(() => {
    if (status.current === InteractiveObjectStatus.HIDDEN) {
      const [hiddenX, hiddenY, hiddenZ] = HIDDEN_POSITION;
      api.position.set(hiddenX, hiddenY, hiddenZ);
      api.velocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0);
    }

    if (status.current === InteractiveObjectStatus.PICKED) {
      zCamVec.set(0.15, -0.15, -0.4);
      const position = camera.localToWorld(zCamVec);
      camera.getWorldDirection(rotationDirection);
      rotationDirection.normalize();
      const theta = Math.atan2(rotationDirection.x, rotationDirection.z);

      api.position.set(position.x, position.y, position.z);
      api.rotation.set(0, theta + Math.PI, 0);
      api.velocity.set(0, 0, 0);
      api.mass.set(0);
    }

    if (status.current === InteractiveObjectStatus.ANIMATED) {
      api.position.set(...(aPosition.get() as PositionTuple));
      api.rotation.set(0, 0, 0);
      api.velocity.set(0, 0, 0);
      api.mass.set(0);
    }

    if (status.current === InteractiveObjectStatus.ATTACHED_EXPRESS) {
      api.position.set(...EXPRESS_POSITION);
      api.rotation.set(0, 0, 0);
      api.velocity.set(0, 0, 0);
      api.mass.set(0);
    }
  });

  useEvent('keydown', ({ key }) => {
    if (!key) {
      return;
    }

    if (key === ' ') {
      if (status.current === InteractiveObjectStatus.PICKED) {
        const camPosition = new THREE.Vector3();
        const position = camera.getWorldPosition(camPosition);
        const target = new THREE.Vector3();
        const targetMesh = raycaster.intersectObjects(scene.children)?.[0];

        if (targetMesh) {
          const distance = position.distanceTo(targetMesh.point);
          camera.getWorldDirection(target);
          const { x, y, z } = target.multiplyScalar(Math.min(distance * 2, 10));

          api.velocity.set(x, y, z);
          api.mass.set(1);
          api.rotation.set(
            Math.random() * 3,
            Math.random() * 3,
            Math.random() * 3
          );

          setState({ playerStatus: null });
          status.current = undefined;

          if (getState().coffeeState === 'ready') {
            setState({ coffeeState: null });
          }
        }
      }
    }
  });

  return (
    <>
      <a.group ref={ref} name="transform">
        <group name="transform-big" visible={!transformed}>
          <mesh
            geometry={mugNodes.Cylinder003.geometry}
            material={mugMaterials.salmonToukCupMaterial}
            castShadow
          />
          <mesh
            geometry={mugNodes.Cylinder003_1.geometry}
            material={mugMaterials.blackPlasticMaterial}
          />
          <mesh
            geometry={mugNodes.Cylinder003_2.geometry}
            material={mugMaterials.cupRedEmmisiveMAterial}
          />
          <mesh
            visible={coffeeState === 'ready'}
            geometry={mugNodes.Cylinder003_3.geometry}
            material={mugMaterials.coffeeMaterial}
          />
        </group>
        <group visible={transformed}>
          <mesh
            geometry={mugNodes.Cylinder009.geometry}
            material={mugMaterials.blackPlasticMaterial}
          />
          <mesh
            geometry={mugNodes.Cylinder009_1.geometry}
            material={mugMaterials.cupWhiteMaterial}
            castShadow
          />
          <mesh
            geometry={mugNodes.Cylinder009_2.geometry}
            material={mugMaterials.cupRedEmmisiveMAterial}
          />
          <mesh
            visible={coffeeState === 'ready'}
            geometry={mugNodes.Cylinder009_3.geometry}
            material={mugMaterials.coffeeMaterial}
          />
        </group>
      </a.group>
      <group
        onClick={handleDummyClick}
        position={CUPBOARD_POSITION}
        name="dummy"
        ref={dummyRef}
      >
        <group>
          <mesh
            geometry={mugNodes.Cylinder003.geometry}
            material={mugMaterials.salmonToukCupMaterial}
          />
          <mesh
            geometry={mugNodes.Cylinder003_1.geometry}
            material={mugMaterials.blackPlasticMaterial}
          />
          <mesh
            geometry={mugNodes.Cylinder003_2.geometry}
            material={mugMaterials.cupRedEmmisiveMAterial}
          />
        </group>
      </group>
    </>
  );
}
