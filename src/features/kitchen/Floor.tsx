import { RigidBody } from '@react-three/rapier';

const HARD_SURFACE_FRICTION = 0.85;
const HARD_SURFACE_RESTITUTION = 0.05;

export function Floor(): JSX.Element {
  return (
    <RigidBody
      type="fixed"
      colliders="trimesh"
      friction={HARD_SURFACE_FRICTION}
      restitution={HARD_SURFACE_RESTITUTION}
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
