import * as THREE from 'three';

import { createHeldItemPoseHelper } from './heldItemPose';

function updateCamera(camera: THREE.Camera) {
  camera.updateMatrixWorld(true);
}

test('transforms a held-item offset from camera-local to world coordinates', () => {
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(10, 2, -4);
  camera.rotation.set(0, Math.PI / 2, 0);
  updateCamera(camera);

  const pose = createHeldItemPoseHelper().compute(camera, [1, 2, -3]);

  expect(pose.position.x).toBeCloseTo(7);
  expect(pose.position.y).toBeCloseTo(4);
  expect(pose.position.z).toBeCloseTo(-5);
});

test('aligns yaw and quaternion with the camera direction and custom offset', () => {
  const camera = new THREE.PerspectiveCamera();
  camera.rotation.set(0, -Math.PI / 4, 0);
  updateCamera(camera);

  const yawOffset = Math.PI / 6;
  const expectedYaw = 3 * (Math.PI / 4) + yawOffset;
  const expectedQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, expectedYaw, 0)
  );
  const pose = createHeldItemPoseHelper().compute(
    camera,
    [0, 0, 0],
    yawOffset
  );

  expect(pose.yaw).toBeCloseTo(expectedYaw);
  expect(pose.rotation.x).toBeCloseTo(0);
  expect(pose.rotation.y).toBeCloseTo(expectedYaw);
  expect(pose.rotation.z).toBeCloseTo(0);
  expect(pose.quaternion.x).toBeCloseTo(expectedQuaternion.x);
  expect(pose.quaternion.y).toBeCloseTo(expectedQuaternion.y);
  expect(pose.quaternion.z).toBeCloseTo(expectedQuaternion.z);
  expect(pose.quaternion.w).toBeCloseTo(expectedQuaternion.w);
});

test('reuses pose values without retaining a previous camera transform', () => {
  const camera = new THREE.PerspectiveCamera();
  const helper = createHeldItemPoseHelper();
  camera.position.set(1, 2, 3);
  camera.rotation.set(0, 0, 0);
  updateCamera(camera);

  const firstPose = helper.compute(camera, [0.5, -1, -2], 0);
  const position = firstPose.position;
  const rotation = firstPose.rotation;
  const quaternion = firstPose.quaternion;

  camera.position.set(-4, 5, 6);
  camera.rotation.set(0, Math.PI / 2, 0);
  updateCamera(camera);

  const secondPose = helper.compute(camera, [0, 0, 0], 0);

  expect(secondPose).toBe(firstPose);
  expect(secondPose.position).toBe(position);
  expect(secondPose.rotation).toBe(rotation);
  expect(secondPose.quaternion).toBe(quaternion);
  expect(secondPose.position.toArray()).toEqual([-4, 5, 6]);
  expect(secondPose.yaw).toBeCloseTo(-Math.PI / 2);
  expect(secondPose.quaternion.x).toBeCloseTo(0);
  expect(secondPose.quaternion.y).toBeCloseTo(-Math.sqrt(0.5));
  expect(secondPose.quaternion.z).toBeCloseTo(0);
  expect(secondPose.quaternion.w).toBeCloseTo(Math.sqrt(0.5));
});
