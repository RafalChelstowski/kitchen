import { useEvent } from 'react-use';

import { create } from 'zustand';

import { useStore } from '../../store/store';
import { KeyboardKeys } from '../../types';

export interface Controls {
  controlsUp: boolean;
  controlsDown: boolean;
  controlsLeft: boolean;
  controlsRight: boolean;
}

export const useControlsStore = create<Controls>(() => ({
  controlsUp: false,
  controlsDown: false,
  controlsLeft: false,
  controlsRight: false,
}));

export function useControls(): void {
  const isLocked = useStore((state) => state.isLocked);

  useEvent('keydown', ({ key }) => {
    if (!key || !isLocked) {
      return;
    }

    switch (key.toLowerCase()) {
      case KeyboardKeys.W:
        useControlsStore.setState({ controlsUp: true });
        break;
      case KeyboardKeys.S:
        useControlsStore.setState({ controlsDown: true });
        break;
      case KeyboardKeys.A:
        useControlsStore.setState({ controlsLeft: true });
        break;
      case KeyboardKeys.D:
        useControlsStore.setState({ controlsRight: true });
        break;
      default:
        break;
    }
  });

  useEvent('keyup', ({ key }) => {
    if (!key || !isLocked) {
      return;
    }

    switch (key.toLowerCase()) {
      case KeyboardKeys.W:
        useControlsStore.setState({ controlsUp: false });
        break;
      case KeyboardKeys.S:
        useControlsStore.setState({ controlsDown: false });
        break;
      case KeyboardKeys.A:
        useControlsStore.setState({ controlsLeft: false });
        break;
      case KeyboardKeys.D:
        useControlsStore.setState({ controlsRight: false });
        break;

      default:
        break;
    }
  });
}
