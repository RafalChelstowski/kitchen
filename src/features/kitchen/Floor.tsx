import { usePlane } from '@react-three/cannon';
import { Mesh } from 'three';

export function Floor(): JSX.Element {
  const [ref] = usePlane<Mesh>(() => ({
    position: [0, -4.5, 0],
    rotation: [-Math.PI / 2, 0, 0],
    type: 'Static',
  }));

  return (
    <mesh name="floor" ref={ref}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
