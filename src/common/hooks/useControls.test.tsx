import { fireEvent, render } from '@testing-library/react';

import { initialState, setState } from '../../store/store';

import {
  useControls,
  useControlsStore,
  type Controls,
} from './useControls';

function ControlsHarness(): null {
  useControls();

  return null;
}

const emptyControls: Controls = {
  controlsUp: false,
  controlsDown: false,
  controlsLeft: false,
  controlsRight: false,
};

const movementKeys = [
  { key: 'w', control: 'controlsUp' as const },
  { key: 's', control: 'controlsDown' as const },
  { key: 'a', control: 'controlsLeft' as const },
  { key: 'd', control: 'controlsRight' as const },
];

beforeEach(() => {
  useControlsStore.setState(emptyControls);
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
});

test.each(movementKeys)(
  '$key keydown and keyup update only its matching control while locked',
  ({ key, control }) => {
    setState({ isLocked: true });
    render(<ControlsHarness />);

    fireEvent.keyDown(window, { key });

    expect(useControlsStore.getState()).toEqual({
      ...emptyControls,
      [control]: true,
    });

    fireEvent.keyUp(window, { key });

    expect(useControlsStore.getState()).toEqual(emptyControls);
  }
);

test.each(movementKeys)(
  'ignores $key keydown and keyup while pointer lock is inactive',
  ({ key, control }) => {
    setState({ isLocked: false });
    render(<ControlsHarness />);

    fireEvent.keyDown(window, { key });
    expect(useControlsStore.getState()).toEqual(emptyControls);

    const controlsBeforeKeyUp = {
      ...emptyControls,
      [control]: true,
    };
    useControlsStore.setState(controlsBeforeKeyUp);

    fireEvent.keyUp(window, { key });
    expect(useControlsStore.getState()).toEqual(controlsBeforeKeyUp);
  }
);

test.each(movementKeys)('normalizes uppercase $key movement keys', ({ key, control }) => {
  setState({ isLocked: true });
  render(<ControlsHarness />);

  fireEvent.keyDown(window, { key: key.toUpperCase() });

  expect(useControlsStore.getState()).toEqual({
    ...emptyControls,
    [control]: true,
  });

  fireEvent.keyUp(window, { key: key.toUpperCase() });

  expect(useControlsStore.getState()).toEqual(emptyControls);
});

test.each(['x', 'ArrowUp', 'Enter'])('leaves controls unchanged for %s', (key) => {
  setState({ isLocked: true });
  useControlsStore.setState({ controlsUp: true, controlsRight: true });
  render(<ControlsHarness />);

  fireEvent.keyDown(window, { key });
  expect(useControlsStore.getState()).toEqual({
    ...emptyControls,
    controlsUp: true,
    controlsRight: true,
  });

  fireEvent.keyUp(window, { key });
  expect(useControlsStore.getState()).toEqual({
    ...emptyControls,
    controlsUp: true,
    controlsRight: true,
  });
});
