import { useEffect, useRef, useState } from 'react';

import { a, config, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Material, Mesh } from 'three';

import { useAchievement } from '../../user/useAchievement';
import { getState, setState, subscribe } from '../../../store/store';
import {
  AchievementName,
  GLTFResult,
  InteractiveLetters,
  InteractiveObjectStatus,
} from '../../../types';

type PositionTuple = [number, number, number];

const tPresentationPos: PositionTuple = [0.53, 0.98, 5.95];
const tInitialPos: PositionTuple = [0.2, 0.35, -3.8];
const tAnim: PositionTuple[] = [
  [0.1, 0.35, -4.1],
  [0.2, 1.5, -3.8],
  [2, 0.7, -1.8],
  tPresentationPos,
];

const oPresentationPos: PositionTuple = [0.42, 0.98, 5.96];
const oInitialPos: PositionTuple = [-2.8, 0.82, -3.4];
const oAnim: PositionTuple[] = [
  [-2.14, 1, -3.42],
  [-1.6, 1.5, -0.5],
  [2.6, 1, 0.1],
  oPresentationPos,
];

const uPresentationPos: PositionTuple = [0.29, 0.98, 5.98];
const uInitialPos: PositionTuple = [2.29, 0.75, 0.245];
const uAnim: PositionTuple[] = [
  [2.1, 0.9, 0.28],
  [-2.3, 2, 3.9],
  [2.4, 1, 3.8],
  uPresentationPos,
];

const kPresentationPos: PositionTuple = [0.23, 0.98, 5.97];
const kInitialPos: PositionTuple = [2.9, 1, -3.82];
const kAnim: PositionTuple[] = [
  [1.9, 0.9, -3.65],
  [0.2, 2, 0.75],
  [0, 1.5, 5.6],
  kPresentationPos,
];

interface LetterProps {
  letter: keyof InteractiveLetters;
  geometry: BufferGeometry;
  material: Material;
  achievementName: AchievementName;
  initialPos: PositionTuple;
  animPos: PositionTuple[];
}

function Letter({
  letter,
  geometry,
  material,
  achievementName,
  initialPos,
  animPos,
}: LetterProps): JSX.Element {
  const ref = useRef<Mesh>(null);
  const collectedRef = useRef(getState().letters[letter]);
  const statusRef = useRef(InteractiveObjectStatus.DROPPED);

  const [animated, setAnimated] = useState(false);

  useEffect(
    () =>
      subscribe((state) => {
        collectedRef.current = state.letters[letter];
      }),
    [letter]
  );

  const { addAchievement } = useAchievement();

  const { position } = useSpring({
    config: config.slow,
    to: async (next) => {
      if (animated) {
        for (let index = 0; index < animPos.length; index += 1) {
          // eslint-disable-next-line no-await-in-loop
          await next({ position: animPos[index] });
        }
        setAnimated(false);
        statusRef.current = InteractiveObjectStatus.DROPPED;
        ref.current?.rotation.set(0, 0, 0);
      }
    },
    from: {
      position: initialPos,
    },
    reset: true,
  });

  useFrame(() => {
    if (!collectedRef.current && ref.current) {
      ref.current.rotation.y += 0.03;
    }

    if (statusRef.current === InteractiveObjectStatus.ANIMATED && ref.current) {
      ref.current.position.set(...position.get());
      ref.current.rotation.set(...position.get());
    }
  });

  return (
    <a.mesh
      ref={ref}
      geometry={geometry}
      material={material}
      position={initialPos}
      onClick={(e) => {
        e.stopPropagation();

        if (ref.current && !collectedRef.current) {
          // ref.current.position.set(...presentationPos);
          // ref.current.rotation.set(0, 0, 0);
          setAnimated(true);
          statusRef.current = InteractiveObjectStatus.ANIMATED;
          setState((state) => ({
            letters: { ...state.letters, [letter]: true },
          }));
          addAchievement(achievementName);
        }
      }}
    />
  );
}

export function Letters(): JSX.Element {
  const { nodes, materials } = useGLTF(
    '/letters.gltf'
  ) as unknown as GLTFResult;

  return (
    <group>
      <Letter
        letter="t"
        geometry={nodes.letterT.geometry}
        material={materials.toukLettersMaterial}
        achievementName={AchievementName.AT}
        initialPos={tInitialPos}
        animPos={tAnim}
      />
      <Letter
        letter="o"
        geometry={nodes.letterO.geometry}
        material={materials.toukLettersMaterial}
        achievementName={AchievementName.BO}
        initialPos={oInitialPos}
        animPos={oAnim}
      />
      <Letter
        letter="u"
        geometry={nodes.letterU.geometry}
        material={materials.toukLettersMaterial}
        achievementName={AchievementName.CU}
        initialPos={uInitialPos}
        animPos={uAnim}
      />
      <Letter
        letter="k"
        geometry={nodes.letterK.geometry}
        material={materials.toukLettersMaterial}
        achievementName={AchievementName.DK}
        initialPos={kInitialPos}
        animPos={kAnim}
      />
    </group>
  );
}

useGLTF.preload('/letters.gltf');
