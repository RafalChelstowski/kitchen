import { createRef } from 'react';
import type { RapierRigidBody } from '@react-three/rapier';

import {
  createFrameController,
  createGltfFixture,
  createRapierMocks,
  createUseFrameMock,
  render3D,
} from './index';
import type { TestFrameCallback } from './index';

function FrameSubscriber({
  callback,
  useFrame,
}: {
  callback: TestFrameCallback;
  useFrame: ReturnType<typeof createUseFrameMock>;
}): JSX.Element {
  useFrame(callback);

  return <group name="frame-subscriber" />;
}

test('keeps frame callbacks deterministic', () => {
  const controller = createFrameController();
  const callback = vi.fn();
  const unsubscribe = controller.subscribe(callback);

  controller.advanceFrames(2, [0.1, 0.2]);

  expect(callback).toHaveBeenCalledTimes(2);
  expect(controller.state.frame).toBe(2);
  expect(controller.state.clock.getElapsedTime()).toBeCloseTo(0.3);
  expect(callback).toHaveBeenLastCalledWith(
    controller.state,
    0.2
  );

  unsubscribe();
  controller.advance();
  expect(callback).toHaveBeenCalledTimes(2);
});

test('cleans up mocked frame callbacks when a component unmounts', async () => {
  const controller = createFrameController();
  const callback = vi.fn();
  const useFrameMock = createUseFrameMock(controller);
  const renderer = await render3D(
    <FrameSubscriber callback={callback} useFrame={useFrameMock} />
  );

  controller.advance();
  expect(callback).toHaveBeenCalledTimes(1);

  await renderer.unmount();
  controller.advance();

  expect(callback).toHaveBeenCalledTimes(1);
  expect(controller.callbacks).toHaveLength(0);
});

test('creates real GLTF-shaped nodes with relationships and transforms', () => {
  const fixture = createGltfFixture({
    nodes: [
      {
        kind: 'group',
        name: 'fixture-parent',
        position: [1, 2, 3],
        children: [
          {
            kind: 'mesh',
            name: 'fixture-child',
            position: [0.5, 0, 0],
          },
        ],
      },
    ],
  });
  const parent = fixture.nodes['fixture-parent'];
  const child = fixture.nodes['fixture-child'];

  expect(parent).toBeDefined();
  expect(child).toBeDefined();
  expect(child.parent).toBe(parent);
  expect(parent.position.toArray()).toEqual([1, 2, 3]);
  const mesh = child as unknown as {
    geometry: { isBufferGeometry: boolean };
    isMesh: boolean;
  };
  expect(mesh.isMesh).toBe(true);
  expect(mesh.geometry.isBufferGeometry).toBe(true);
  expect(fixture.materials.fixtureMaterial.isMaterial).toBe(true);
});

test('keeps Rapier props and exposes imperative body refs', async () => {
  const mocks = createRapierMocks();
  const bodyRef = createRef<RapierRigidBody>();
  const renderer = await render3D(
    <mocks.Physics gravity={[0, -2, 0]}>
      <mocks.RigidBody
        ref={bodyRef}
        type="fixed"
        colliders={false}
        position={[1, 2, 3]}
      >
        <mocks.CuboidCollider args={[0.5, 0.5, 0.5]} friction={0.8} />
        <mesh name="mock-body" />
      </mocks.RigidBody>
    </mocks.Physics>
  );

  expect(bodyRef.current).not.toBeNull();
  bodyRef.current?.setTranslation({ x: 4, y: 5, z: 6 }, true);
  expect(mocks.bodies[0].translation()).toEqual({ x: 4, y: 5, z: 6 });
  expect(mocks.bodies[0].state.bodyType).toBe('fixed');
  expect(mocks.bodies[0].calls.at(-1)?.method).toBe('setTranslation');
  expect(mocks.colliders[0].props.args).toEqual([0.5, 0.5, 0.5]);

  const bodyNode = renderer.findByName('mock-body');
  const bodyMetadata = bodyNode.instance.parent?.userData.rapier as {
    props: { type: string; colliders: false };
  };
  expect(bodyMetadata.props).toMatchObject({
    colliders: false,
    type: 'fixed',
  });

  await renderer.unmount();
});
