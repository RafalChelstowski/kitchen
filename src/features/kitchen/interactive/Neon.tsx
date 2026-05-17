import { useState } from 'react';

import { a, useSpring } from '@react-spring/three';
import { MathUtils } from 'three';

import { useAchievement } from '../../user/useAchievement';
import { disabledNeonMaterial } from '../../../common/materials/materials';
import { getState, useStore } from '../../../store/store';
import { AchievementName } from '../../../types';
import { useKitchenGltf } from '../useKitchenGltf';

const { degToRad } = MathUtils;

export function Neon(): JSX.Element {
  const { nodes, materials } = useKitchenGltf();

  const neonUnlocked = useStore((state) => state.achievements.neon);
  const [neonOn, toggleNeonOn] = useState(0);
  const { spring } = useSpring({
    spring: neonOn,
    config: { mass: 20, tension: 400, friction: 300, precision: 0.0001 },
  });
  const rotation = spring.to([0, 1], [0, degToRad(10)]);
  const { addAchievement } = useAchievement();

  return (
    <>
      <a.mesh
        geometry={nodes.switch_button.geometry}
        material={materials.whiteMaterial}
        position={[2.677, 1.16, -1.164]}
        rotation-z={rotation}
        onClick={() => {
          const { t, o, u, k } = getState().letters;
          if (neonUnlocked || (t && o && u && k)) {
            toggleNeonOn(Number(!neonOn));
            addAchievement(AchievementName.NEON);
          }
        }}
      />
      <mesh
        geometry={nodes.switch_container.geometry}
        material={materials.whiteMaterial}
        position={[2.69, 1.16, -1.14]}
      />
      <mesh
        geometry={nodes.NurbsPath001.geometry}
        material={neonOn ? materials.neonMaterialWhite : disabledNeonMaterial}
        position={[5.29, 1.06, -2.66]}
      />
      <mesh
        geometry={nodes.NurbsPath002.geometry}
        material={neonOn ? materials.neonMaterialGreen : disabledNeonMaterial}
        position={[5.29, 1.06, -2.66]}
      />
      <mesh
        geometry={nodes.NurbsPath003.geometry}
        material={neonOn ? materials.neonMaterialPurple : disabledNeonMaterial}
        position={[5.29, 1.06, -2.66]}
      />
      <mesh
        geometry={nodes.Cube108.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 0.87, -2.54]}
      />
      <mesh
        geometry={nodes.Cube109.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 0.97, -2.48]}
      />
      <mesh
        geometry={nodes.Cube110.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 0.7, -2.39]}
      />
      <mesh
        geometry={nodes.Cube111.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 0.65, -3.18]}
      />
      <mesh
        geometry={nodes.Cube112.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 1, -2.28]}
      />
      <mesh
        geometry={nodes.Cube113.geometry}
        material={nodes.Cube113.material}
        position={[5.31, 1.2, -3.09]}
      />
      <mesh
        geometry={nodes.NurbsPath.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 1.72, -2.96]}
      />
      <mesh
        geometry={nodes.NurbsPath004.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 1.72, -2.95]}
      />
      <mesh
        geometry={nodes.Cube114.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 1.28, -2.79]}
      />
      <mesh
        geometry={nodes.NurbsPath005.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.32, 1.72, -2.95]}
      />
      <mesh
        geometry={nodes.NurbsPath006.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 0.99, -3.34]}
      />
      <mesh
        geometry={nodes.NurbsPath007.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 1.22, -2.71]}
      />
      <mesh
        geometry={nodes.Cube115.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 0.7, -2.57]}
      />
      <mesh
        geometry={nodes.NurbsPath008.geometry}
        material={materials.blackPlasticMaterial}
        position={[5.31, 1.7, -2.2]}
      />
    </>
  );
}
