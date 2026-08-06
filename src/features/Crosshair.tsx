import { useCallback } from 'react';

import { useStore } from '../store/store';

export function Crosshair(): JSX.Element | null {
  const isLocked = useStore(useCallback((state) => state.isLocked, []));

  if (!isLocked) {
    return null;
  }

  return (
    <>
      <div
        data-testid="crosshair"
        className="absolute w-2 h-2 z-50 top-2/4 left-2/4 bg-green-400 -mt-1 -ml-1"
      />
    </>
  );
}
