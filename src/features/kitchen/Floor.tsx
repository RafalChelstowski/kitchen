import { RigidBody } from '@react-three/rapier';

export function Floor(): JSX.Element {
  return (
    <RigidBody
      type="fixed"
      colliders="trimesh"
      position={[0, -4.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <mesh name="floor">
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </RigidBody>
  );
}
