import { useLayoutEffect } from 'react';

export interface TestFrameState {
  clock: {
    elapsedTime: number;
    getDelta: () => number;
    getElapsedTime: () => number;
  };
  frame: number;
}

export type TestFrameCallback = (state: TestFrameState, delta: number) => void;

export interface FrameController {
  readonly callbacks: readonly TestFrameCallback[];
  readonly state: TestFrameState;
  advance: (frames?: number, delta?: number | number[]) => void;
  advanceFrames: (frames?: number, delta?: number | number[]) => void;
  clear: () => void;
  subscribe: (callback: TestFrameCallback) => () => void;
}

export interface FrameControllerOptions {
  initialElapsedTime?: number;
}

/**
 * A deterministic frame source for tests that mock `useFrame`.
 *
 * The real R3F test renderer exposes the same `advanceFrames` operation. This
 * small controller is useful when a component test mocks the fiber hooks and
 * wants to drive callbacks without starting an animation loop.
 */
export function createFrameController(
  options: FrameControllerOptions = {}
): FrameController {
  const callbacks = new Set<TestFrameCallback>();
  const clock = {
    elapsedTime: options.initialElapsedTime ?? 0,
    getDelta: () => lastDelta,
    getElapsedTime: () => clock.elapsedTime,
  };
  const state: TestFrameState = {
    clock,
    frame: 0,
  };
  let lastDelta = 0;

  const advance = (frames = 1, delta: number | number[] = 1 / 60) => {
    if (!Number.isInteger(frames) || frames < 0) {
      throw new RangeError('The number of frames must be a non-negative integer.');
    }

    for (let frame = 0; frame < frames; frame += 1) {
      const frameDelta = Array.isArray(delta)
        ? (delta[frame] ?? delta[delta.length - 1] ?? 0)
        : delta;

      lastDelta = frameDelta;
      clock.elapsedTime += frameDelta;
      state.frame += 1;

      [...callbacks].forEach((callback) => {
        callback(state, frameDelta);
      });
    }
  };

  return {
    get callbacks() {
      return [...callbacks];
    },
    state,
    advance,
    advanceFrames: advance,
    clear: () => callbacks.clear(),
    subscribe: (callback) => {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
  };
}

/**
 * Creates the `useFrame` half of a fiber module mock.
 */
export function createUseFrameMock(controller: FrameController) {
  return (callback: TestFrameCallback) => {
    useLayoutEffect(() => controller.subscribe(callback), [callback]);
  };
}

export const createFrameCallbackController = createFrameController;

/**
 * Creates a clock-shaped object for tests that need to provide a stable R3F
 * state to a frame callback.
 */
export function createTestClock(initialElapsedTime = 0): TestFrameState['clock'] {
  let elapsedTime = initialElapsedTime;
  let delta = 0;

  return {
    get elapsedTime() {
      return elapsedTime;
    },
    set elapsedTime(value: number) {
      delta = value - elapsedTime;
      elapsedTime = value;
    },
    getDelta: () => delta,
    getElapsedTime: () => elapsedTime,
  };
}
