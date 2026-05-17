import * as THREE from 'three';

export type HeldItemOffset = readonly [number, number, number];

export interface HeldItemPose {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
  yaw: number;
}

export function createHeldItemPoseHelper() {
  const position = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const pose: HeldItemPose = {
    position,
    rotation,
    quaternion,
    yaw: 0,
  };

  return {
    compute(
      camera: THREE.Camera,
      offset: HeldItemOffset,
      yawOffset = Math.PI
    ) {
      position.set(offset[0], offset[1], offset[2]);
      camera.localToWorld(position);
      camera.getWorldDirection(direction);
      direction.normalize();

      pose.yaw = Math.atan2(direction.x, direction.z) + yawOffset;
      rotation.set(0, pose.yaw, 0);
      quaternion.setFromEuler(rotation);

      return pose;
    },
  };
}
