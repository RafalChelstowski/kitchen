import { useCallback, useState } from 'react';
import { useEvent } from 'react-use';

import { useStore } from '../../store/store';
import { KeyboardKeys } from '../../types';

interface UseControlsHook {
  controlsUp: boolean;
  controlsDown: boolean;
  controlsLeft: boolean;
  controlsRight: boolean;
}

export function useControls(): UseControlsHook {
  const isLocked = useStore(useCallback((state) => state.isLocked, []));
  const [controlsUp, setControlsUp] = useState(false);
  const [controlsDown, setControlsDown] = useState(false);
  const [controlsLeft, setControlsLeft] = useState(false);
  const [controlsRight, setControlsRight] = useState(false);

  useEvent('keydown', ({ key }) => {
    if (!key || !isLocked) {
      return;
    }

    switch (key.toLowerCase()) {
      case KeyboardKeys.W:
        setControlsUp(true);
        break;
      case KeyboardKeys.S:
        setControlsDown(true);
        break;
      case KeyboardKeys.A:
        setControlsLeft(true);
        break;
      case KeyboardKeys.D:
        setControlsRight(true);
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
        setControlsUp(false);
        break;
      case KeyboardKeys.S:
        setControlsDown(false);
        break;
      case KeyboardKeys.A:
        setControlsLeft(false);
        break;
      case KeyboardKeys.D:
        setControlsRight(false);
        break;

      default:
        break;
    }
  });

  return {
    controlsUp,
    controlsDown,
    controlsLeft,
    controlsRight,
  };
}
