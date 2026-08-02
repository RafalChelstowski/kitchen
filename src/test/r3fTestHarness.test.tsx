import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';

import { render3D } from './r3fTestRenderer';

function RotatingMesh(): JSX.Element {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    ref.current?.rotateY(delta);
  });

  return <mesh ref={ref} name="frame-mesh" />;
}

test('renders a real Three.js scene without WebGL', async () => {
  const clicked = vi.fn();
  const renderer = await render3D(
    <group name="smoke-root" position={[1, 2, 3]}>
      <mesh name="smoke-mesh" onClick={clicked}>
        <boxGeometry args={[2, 3, 4]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </group>
  );

  const node = renderer.findByName('smoke-mesh');
  const mesh = node.instance as Mesh;

  expect(mesh.isMesh).toBe(true);
  expect(mesh.geometry.isBufferGeometry).toBe(true);
  expect((mesh.geometry as BoxGeometry).type).toBe('BoxGeometry');
  expect((mesh.material as MeshBasicMaterial).isMaterial).toBe(true);
  expect(mesh.parent?.name).toBe('smoke-root');
  expect(mesh.parent?.position.toArray()).toEqual([1, 2, 3]);

  await renderer.fireEvent(node, 'click', { distance: 1 });
  expect(clicked).toHaveBeenCalledTimes(1);

  await renderer.unmount();
});

test('advances real R3F frame callbacks on demand', async () => {
  const renderer = await render3D(<RotatingMesh />);
  const mesh = renderer.findByName('frame-mesh').instance as Mesh;

  await renderer.advanceFrames(2, 0.25);

  expect(mesh.rotation.y).toBeCloseTo(0.5);
  await renderer.unmount();
});
