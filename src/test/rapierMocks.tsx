import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type {
  InstancedRigidBodiesProps,
  RapierRigidBody,
  RigidBodyProps,
} from '@react-three/rapier';

export interface MockVector {
  x: number;
  y: number;
  z: number;
}

export interface MockQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface MockRapierCall {
  method: string;
  args: readonly unknown[];
}

export interface MockRapierBodyState {
  additionalMass: number;
  angularVelocity: MockVector;
  bodyType: unknown;
  enabled: boolean;
  linearVelocity: MockVector;
  rotation: MockQuaternion;
  sleeping: boolean;
  translation: MockVector;
}

export interface MockRapierBody {
  readonly calls: MockRapierCall[];
  readonly state: MockRapierBodyState;
  additionalMass: () => number;
  angvel: () => MockVector;
  applyImpulse: (impulse: MockVector, wakeUp: boolean) => void;
  applyTorqueImpulse: (impulse: MockVector, wakeUp: boolean) => void;
  bodyType: () => unknown;
  isEnabled: () => boolean;
  isSleeping: () => boolean;
  linvel: () => MockVector;
  lockRotations: (locked: boolean, wakeUp: boolean) => void;
  lockTranslations: (locked: boolean, wakeUp: boolean) => void;
  mass: () => number;
  resetForces: (wakeUp: boolean) => void;
  resetTorques: (wakeUp: boolean) => void;
  setAdditionalMass: (mass: number, wakeUp: boolean) => void;
  setAngvel: (velocity: MockVector, wakeUp: boolean) => void;
  setBodyType: (bodyType: unknown, wakeUp: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setLinvel: (velocity: MockVector, wakeUp: boolean) => void;
  setNextKinematicRotation: (rotation: MockQuaternion) => void;
  setNextKinematicTranslation: (translation: MockVector) => void;
  setRotation: (rotation: MockQuaternion, wakeUp: boolean) => void;
  setTranslation: (translation: MockVector, wakeUp: boolean) => void;
  sleep: () => void;
  translation: () => MockVector;
  wakeUp: () => void;
  rotation: () => MockQuaternion;
}

export interface MockRapierCollider {
  readonly kind: string;
  readonly props: Record<string, unknown>;
}

export interface MockRapierModule {
  RigidBodyType: {
    Dynamic: string;
    Fixed: string;
    KinematicPositionBased: string;
    KinematicVelocityBased: string;
  };
}

export interface MockRapierContext {
  rapier: MockRapierModule;
  world: Record<string, never>;
}

export interface RapierMockOptions {
  body?: MockRapierBody;
  bodyFactory?: (props: Record<string, unknown>) => MockRapierBody;
}

export interface MockColliderProps extends Record<string, unknown> {
  args?: unknown;
  children?: ReactNode;
}

export interface RapierMocks {
  BallCollider: ComponentType<MockColliderProps>;
  CapsuleCollider: ComponentType<MockColliderProps>;
  ConeCollider: ComponentType<MockColliderProps>;
  ConvexHullCollider: ComponentType<MockColliderProps>;
  CuboidCollider: ComponentType<MockColliderProps>;
  CylinderCollider: ComponentType<MockColliderProps>;
  HeightfieldCollider: ComponentType<MockColliderProps>;
  MeshCollider: ComponentType<MockColliderProps>;
  RoundCuboidCollider: ComponentType<MockColliderProps>;
  TrimeshCollider: ComponentType<MockColliderProps>;
  Physics: ComponentType<MockPhysicsProps>;
  RigidBody: ComponentType<RigidBodyProps>;
  InstancedRigidBodies: ComponentType<InstancedRigidBodiesProps>;
  bodies: MockRapierBody[];
  colliders: MockRapierCollider[];
  physics: MockPhysicsProps[];
  rapier: MockRapierModule;
  useAfterPhysicsStep: () => void;
  useBeforePhysicsStep: () => void;
  useRapier: () => MockRapierContext;
}

export interface MockPhysicsProps extends Record<string, unknown> {
  children?: ReactNode;
}

export interface MockBodyOptions {
  additionalMass?: number;
  angularVelocity?: MockVector;
  bodyType?: unknown;
  enabled?: boolean;
  linearVelocity?: MockVector;
  rotation?: MockQuaternion;
  translation?: MockVector;
}

function cloneVector(vector: MockVector): MockVector {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function cloneQuaternion(quaternion: MockQuaternion): MockQuaternion {
  return {
    w: quaternion.w,
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
  };
}

function recordCall(
  calls: MockRapierCall[],
  method: string,
  args: readonly unknown[]
): void {
  calls.push({ method, args: [...args] });
}

/** Creates an inspectable body for component tests. */
export function createMockRapierBody(
  options: MockBodyOptions = {}
): MockRapierBody {
  const calls: MockRapierCall[] = [];
  const state: MockRapierBodyState = {
    additionalMass: options.additionalMass ?? 0,
    angularVelocity: cloneVector(
      options.angularVelocity ?? { x: 0, y: 0, z: 0 }
    ),
    bodyType: options.bodyType ?? 'dynamic',
    enabled: options.enabled ?? true,
    linearVelocity: cloneVector(options.linearVelocity ?? { x: 0, y: 0, z: 0 }),
    rotation: cloneQuaternion(
      options.rotation ?? { x: 0, y: 0, z: 0, w: 1 }
    ),
    sleeping: false,
    translation: cloneVector(options.translation ?? { x: 0, y: 0, z: 0 }),
  };

  const body: MockRapierBody = {
    calls,
    state,
    additionalMass: () => state.additionalMass,
    angvel: () => cloneVector(state.angularVelocity),
    applyImpulse: (impulse, wakeUp) => {
      recordCall(calls, 'applyImpulse', [impulse, wakeUp]);
      state.linearVelocity = {
        x: state.linearVelocity.x + impulse.x,
        y: state.linearVelocity.y + impulse.y,
        z: state.linearVelocity.z + impulse.z,
      };
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    applyTorqueImpulse: (impulse, wakeUp) => {
      recordCall(calls, 'applyTorqueImpulse', [impulse, wakeUp]);
      state.angularVelocity = {
        x: state.angularVelocity.x + impulse.x,
        y: state.angularVelocity.y + impulse.y,
        z: state.angularVelocity.z + impulse.z,
      };
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    bodyType: () => state.bodyType,
    isEnabled: () => state.enabled,
    isSleeping: () => state.sleeping,
    linvel: () => cloneVector(state.linearVelocity),
    lockRotations: (locked, wakeUp) => {
      recordCall(calls, 'lockRotations', [locked, wakeUp]);
    },
    lockTranslations: (locked, wakeUp) => {
      recordCall(calls, 'lockTranslations', [locked, wakeUp]);
    },
    mass: () => 1 + state.additionalMass,
    resetForces: (wakeUp) => {
      recordCall(calls, 'resetForces', [wakeUp]);
      state.linearVelocity = { x: 0, y: 0, z: 0 };
    },
    resetTorques: (wakeUp) => {
      recordCall(calls, 'resetTorques', [wakeUp]);
      state.angularVelocity = { x: 0, y: 0, z: 0 };
    },
    rotation: () => cloneQuaternion(state.rotation),
    setAdditionalMass: (mass, wakeUp) => {
      recordCall(calls, 'setAdditionalMass', [mass, wakeUp]);
      state.additionalMass = mass;
    },
    setAngvel: (velocity, wakeUp) => {
      recordCall(calls, 'setAngvel', [velocity, wakeUp]);
      state.angularVelocity = cloneVector(velocity);
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    setBodyType: (bodyType, wakeUp) => {
      recordCall(calls, 'setBodyType', [bodyType, wakeUp]);
      state.bodyType = bodyType;
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    setEnabled: (enabled) => {
      recordCall(calls, 'setEnabled', [enabled]);
      state.enabled = enabled;
    },
    setLinvel: (velocity, wakeUp) => {
      recordCall(calls, 'setLinvel', [velocity, wakeUp]);
      state.linearVelocity = cloneVector(velocity);
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    setNextKinematicRotation: (rotation) => {
      recordCall(calls, 'setNextKinematicRotation', [rotation]);
      state.rotation = cloneQuaternion(rotation);
    },
    setNextKinematicTranslation: (translation) => {
      recordCall(calls, 'setNextKinematicTranslation', [translation]);
      state.translation = cloneVector(translation);
    },
    setRotation: (rotation, wakeUp) => {
      recordCall(calls, 'setRotation', [rotation, wakeUp]);
      state.rotation = cloneQuaternion(rotation);
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    setTranslation: (translation, wakeUp) => {
      recordCall(calls, 'setTranslation', [translation, wakeUp]);
      state.translation = cloneVector(translation);
      if (wakeUp) {
        state.sleeping = false;
      }
    },
    sleep: () => {
      recordCall(calls, 'sleep', []);
      state.sleeping = true;
    },
    translation: () => cloneVector(state.translation),
    wakeUp: () => {
      recordCall(calls, 'wakeUp', []);
      state.sleeping = false;
    },
  };

  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toVector(value: unknown): MockVector | undefined {
  if (Array.isArray(value) && value.length >= 3) {
    const [x, y, z] = value;
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof z === 'number'
    ) {
      return { x, y, z };
    }
  }

  if (isRecord(value)) {
    const { x, y, z } = value;
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof z === 'number'
    ) {
      return { x, y, z };
    }
  }

  return undefined;
}

function toQuaternion(value: unknown): MockQuaternion | undefined {
  if (isRecord(value)) {
    const { w, x, y, z } = value;
    if (
      typeof w === 'number' &&
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof z === 'number'
    ) {
      return { w, x, y, z };
    }
  }

  return undefined;
}

function propsRecord(props: object): Record<string, unknown> {
  return { ...(props as Record<string, unknown>) };
}

function sceneProps(
  props: object,
  excluded: readonly string[]
): Record<string, unknown> {
  const result = propsRecord(props);
  excluded.forEach((key) => delete result[key]);
  return result;
}

function withRapierUserData(
  value: unknown,
  metadata: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(isRecord(value) ? value : {}),
    rapier: metadata,
  };
}

function bodyFromProps(
  props: Record<string, unknown>,
  fallback: MockRapierBody | undefined,
  factory: ((props: Record<string, unknown>) => MockRapierBody) | undefined
): MockRapierBody {
  if (factory) {
    return factory(props);
  }

  if (fallback) {
    return fallback;
  }

  return createMockRapierBody({
    bodyType: props.type,
    linearVelocity: toVector(props.linearVelocity),
    rotation: toQuaternion(props.rotation),
    translation: toVector(props.position),
  });
}

/**
 * Creates components suitable for a `vi.mock('@react-three/rapier', ...)`
 * factory. Physics props remain available in metadata and every body ref
 * points at a stateful, inspectable mock.
 */
export function createRapierMocks(options: RapierMockOptions = {}): RapierMocks {
  const bodies: MockRapierBody[] = [];
  const colliders: MockRapierCollider[] = [];
  const physics: MockPhysicsProps[] = [];
  const rapier: MockRapierModule = {
    RigidBodyType: {
      Dynamic: 'dynamic',
      Fixed: 'fixed',
      KinematicPositionBased: 'kinematicPosition',
      KinematicVelocityBased: 'kinematicVelocity',
    },
  };
  let fallbackBody = options.body;

  const registerBody = (props: Record<string, unknown>): MockRapierBody => {
    const body = bodyFromProps(props, fallbackBody, options.bodyFactory);
    fallbackBody = undefined;
    bodies.push(body);
    return body;
  };

  const Physics = ({ children, ...props }: MockPhysicsProps) => {
    physics.push(props);
    return <>{children}</>;
  };
  Physics.displayName = 'MockPhysics';

  const RigidBody = forwardRef<RapierRigidBody, RigidBodyProps>(
    (props, ref) => {
      const [body] = useState(() => registerBody(propsRecord(props)));
      const record = propsRecord(props);
      const { userData } = record;

      useImperativeHandle(
        ref,
        () => body as unknown as RapierRigidBody,
        [body]
      );

      return (
        <group
          {...sceneProps(props, ['children', 'ref', 'type', 'userData'])}
          userData={withRapierUserData(userData, {
            body,
            kind: 'rigidBody',
            props: record,
          })}
        >
          {props.children}
        </group>
      );
    }
  );
  RigidBody.displayName = 'MockRigidBody';

  const createCollider = (kind: string) => {
    const Collider = forwardRef<MockRapierCollider, MockColliderProps>(
      (props, ref) => {
        const [collider] = useState(() => {
          const record = propsRecord(props);
          const created: MockRapierCollider = {
            kind,
            props: record,
          };
          colliders.push(created);
          return created;
        });

        useImperativeHandle(ref, () => collider, [collider]);

        return (
          <group
            {...sceneProps(props, ['children', 'ref', 'userData'])}
            userData={withRapierUserData(props.userData, {
              collider,
              kind: 'collider',
              shape: kind,
            })}
          >
            {props.children as ReactNode}
          </group>
        );
      }
    );
    Collider.displayName = `Mock${kind}Collider`;
    return Collider;
  };

  const InstancedRigidBodies = forwardRef<
    (RapierRigidBody | null)[] | null,
    InstancedRigidBodiesProps
  >((props, ref) => {
    const [instanceBodies] = useState(() =>
      props.instances.map((instance) =>
        registerBody(propsRecord(instance as object))
      )
    );
    const record = propsRecord(props);

    useImperativeHandle(
      ref,
      () => instanceBodies as unknown as (RapierRigidBody | null)[],
      [instanceBodies]
    );

    return (
      <group
        {...sceneProps(props, ['children', 'ref', 'instances', 'userData'])}
        userData={withRapierUserData(record.userData, {
          bodies: instanceBodies,
          kind: 'instancedRigidBodies',
          props: record,
        })}
      >
        {props.children}
      </group>
    );
  });
  InstancedRigidBodies.displayName = 'MockInstancedRigidBodies';

  const useRapier = () => ({
    rapier,
    world: {},
  });
  const useBeforePhysicsStep = () => undefined;
  const useAfterPhysicsStep = () => undefined;

  return {
    BallCollider: createCollider('Ball'),
    CapsuleCollider: createCollider('Capsule'),
    ConeCollider: createCollider('Cone'),
    ConvexHullCollider: createCollider('ConvexHull'),
    CuboidCollider: createCollider('Cuboid'),
    CylinderCollider: createCollider('Cylinder'),
    HeightfieldCollider: createCollider('Heightfield'),
    MeshCollider: createCollider('Mesh'),
    RoundCuboidCollider: createCollider('RoundCuboid'),
    TrimeshCollider: createCollider('Trimesh'),
    Physics,
    RigidBody,
    InstancedRigidBodies,
    bodies,
    colliders,
    physics,
    rapier,
    useAfterPhysicsStep,
    useBeforePhysicsStep,
    useRapier,
  };
}

export const createMockRapierComponents = createRapierMocks;
