import { usePlane } from '@react-three/cannon';

export function Floor(): JSX.Element {
  const [ref] = usePlane(() => ({
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    type: 'Static',
  }));

  return (
    <mesh ref={ref}>
      <planeBufferGeometry args={[100, 100]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}