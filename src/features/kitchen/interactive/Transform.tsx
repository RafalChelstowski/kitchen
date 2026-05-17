import { useRef, useState } from 'react';
import { useEvent } from 'react-use';

import { a, config, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import {
  CylinderCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from '@react-three/rapier';
import * as THREE from 'three';

import { getState, setState, useStore } from '../../../store/store';
import {
  GLTFResult,
  InteractiveObjectStatus,
  PlayerStatus,
} from '../../../types';
import { createHeldItemPoseHelper } from '../heldItemPose';

type PositionTuple = [number, number, number];
type MugBodyType = 'dynamic' | 'kinematicPosition';

const HIDDEN_POSITION: PositionTuple = [0.2, 5.35, -3.8];
const CUPBOARD_POSITION: PositionTuple = [-0.1, 0.63, -3.8];
const EXPRESS_POSITION: PositionTuple = [1.66, 0.99, -5.43];

function setNextMugTransform(
  body: RapierRigidBody,
  quaternion: THREE.Quaternion,
  euler: THREE.Euler,
  position: PositionTuple,
  rotation: PositionTuple
) {
  const [x, y, z] = position;
  const [rX, rY, rZ] = rotation;

  body.setNextKinematicTranslation({ x, y, z });
  body.setNextKinematicRotation(
    quaternion.setFromEuler(euler.set(rX, rY, rZ))
  );
}

export function Transform(): JSX.Element {
  const raycaster = useThree((state) => state.raycaster);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const coffeeState = useStore((state) => state.coffeeState);
  const { rapier } = useRapier();
  const { nodes: mugNodes, materials: mugMaterials } = useGLTF(
    '/transformMug.gltf'
  ) as unknown as GLTFResult;
  const bodyRef = useRef<RapierRigidBody>(null);
  const dummyRef = useRef<THREE.Group>(null);
  const heldPoseHelperRef = useRef(createHeldItemPoseHelper());

  const status = useRef<InteractiveObjectStatus | undefined>(
    InteractiveObjectStatus.HIDDEN
  );

  const [transformed, setTransformed] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [mugBodyType, setMugBodyType] =
    useState<MugBodyType>('kinematicPosition');

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
        setMugBodyType('kinematicPosition');
        bodyRef.current?.setBodyType(
          rapier.RigidBodyType.KinematicPositionBased,
          true
        );
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
        setMugBodyType('kinematicPosition');
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
        setMugBodyType('dynamic');
        bodyRef.current?.setBodyType(rapier.RigidBodyType.Dynamic, true);
        bodyRef.current?.setTranslation(
          { x: point.x, y: point.y + 0.2, z: point.z },
          true
        );
        bodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
        bodyRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true);
        status.current = undefined;
        // setState({ playerStatus: null });
        bodyRef.current?.setAdditionalMass(1, true);

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
      setMugBodyType('kinematicPosition');
      bodyRef.current?.setBodyType(
        rapier.RigidBodyType.KinematicPositionBased,
        true
      );
      setState({ playerStatus: PlayerStatus.PICKED });
    }
  };

  const bodyRotation = new THREE.Quaternion();
  const bodyEuler = new THREE.Euler();

  const posRef = useRef<PositionTuple>([0, 0, 0]);

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
        setMugBodyType('kinematicPosition');
        if (bodyRef.current) {
          setNextMugTransform(
            bodyRef.current,
            bodyRotation,
            bodyEuler,
            EXPRESS_POSITION,
            [0, 0, 0]
          );
        }
        bodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
        bodyRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true);
        bodyRef.current?.setAdditionalMass(0, true);
        setState({ playerStatus: null, coffeeState: 'cupReady' });
      }
    },
    from: {
      aPosition: posRef.current,
    },
    reset: true,
  });

  useFrame(() => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    const position = body.translation();
    posRef.current = [position.x, position.y, position.z];

    if (status.current === InteractiveObjectStatus.HIDDEN) {
      setNextMugTransform(body, bodyRotation, bodyEuler, HIDDEN_POSITION, [
        0, 0, 0,
      ]);
    }

    if (status.current === InteractiveObjectStatus.PICKED) {
      const { position, yaw } = heldPoseHelperRef.current.compute(camera, [
        0.15,
        -0.15,
        -0.4,
      ]);

      setNextMugTransform(
        body,
        bodyRotation,
        bodyEuler,
        [position.x, position.y, position.z],
        [0, yaw, 0]
      );
    }

    if (status.current === InteractiveObjectStatus.ANIMATED) {
      setNextMugTransform(
        body,
        bodyRotation,
        bodyEuler,
        aPosition.get() as PositionTuple,
        [0, 0, 0]
      );
    }

    if (status.current === InteractiveObjectStatus.ATTACHED_EXPRESS) {
      setNextMugTransform(body, bodyRotation, bodyEuler, EXPRESS_POSITION, [
        0, 0, 0,
      ]);
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

          setMugBodyType('dynamic');
          bodyRef.current?.setBodyType(rapier.RigidBodyType.Dynamic, true);
          bodyRef.current?.setLinvel({ x, y, z }, true);
          bodyRef.current?.setAdditionalMass(1, true);
          bodyRef.current?.setRotation(
            bodyRotation.setFromEuler(
              bodyEuler.set(
                Math.random() * 3,
                Math.random() * 3,
                Math.random() * 3
              )
            ),
            true
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
      <RigidBody
        ref={bodyRef}
        type={mugBodyType}
        colliders={false}
        mass={0}
        canSleep={false}
        position={[0, 1, 0]}
        rotation={[0, 0, 0]}
      >
        <CylinderCollider
          args={[0.05, 0.05]}
          onCollisionEnter={() => {
            const y = bodyRef.current?.translation().y ?? Infinity;

            if (y < 0.3 && getState().coffeeState === 'ready') {
              setState({ coffeeState: null });
            }
          }}
        />
        <a.group name="transform">
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
      </RigidBody>
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
