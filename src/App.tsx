import { ReactNode, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';

import { Debug, Physics } from '@react-three/cannon';
import {
  AdaptiveDpr,
  Loader,
  Preload,
  Stats,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { Lights } from './common/components/Lights';
import { Crosshair } from './features/Crosshair';
import { StaticBounds } from './features/kitchen/Bounds';
import { Emissive } from './features/kitchen/Emissive';
import { Env } from './features/kitchen/Env';
import { Floor } from './features/kitchen/Floor';
import { Glass } from './features/kitchen/Glass';
import { Cupboard } from './features/kitchen/interactive/Cupboard';
import { Drawer } from './features/kitchen/interactive/Drawer';
import { Express } from './features/kitchen/interactive/Express';
import { Fridge } from './features/kitchen/interactive/Fridge';
import { Harnas } from './features/kitchen/interactive/Harnas';
import { Letters } from './features/kitchen/interactive/Letters';
import { Microwave } from './features/kitchen/interactive/Microvawe';
import { Neon } from './features/kitchen/interactive/Neon';
import { Transform } from './features/kitchen/interactive/Transform';
import { InteractiveWindow } from './features/kitchen/interactive/Window';
import { KitchenModel } from './features/kitchen/KitchenModel';
import { Mugs } from './features/kitchen/Mugs';
import { Surroundings } from './features/kitchen/Surroundings';
import { Player } from './features/player/Player';
import { UserMenus } from './features/user/UserMenus';

function DevDebug({ children }: { children: ReactNode }): JSX.Element {
  const isDev = import.meta.env.DEV;

  return isDev ? (
    <Debug color="black" scale={1.01}>
      {children}
      <Stats showPanel={0} />
    </Debug>
  ) : (
    <>{children}</>
  );
}

export function App(): JSX.Element {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Canvas
        gl={{
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 50 }}
        shadows
      >
        <Lights />
        <Physics gravity={[0, -2, 0]}>
          <DevDebug>
            <group dispose={null}>
              <Suspense fallback={null}>
                <Player />
                <KitchenModel />
                <Surroundings />
                <Env />
                <Emissive />
                <Glass />
                <StaticBounds />
                <Mugs
                  initialPosition={[-2.3, 1.38, -5.55]}
                  objName="mugs"
                  geometryName="toukMug1"
                  materialName="yellowToukCupMaterial"
                  gltfName="/toukMug.gltf"
                  itemsNumber={12}
                  rowModifier={6}
                />
                <Neon />
                <Floor />
                <Fridge />
                <Express />
                <Drawer />
                <Cupboard />
                <InteractiveWindow />
                <Microwave />
                <Harnas />
                <Letters />
                <Transform />
                <Preload all />
              </Suspense>
            </group>
          </DevDebug>
        </Physics>
        <AdaptiveDpr pixelated />
      </Canvas>
      <Loader />
      <UserMenus />
      <Crosshair />
      <ToastContainer theme="light" autoClose={3000} />
    </div>
  );
}
