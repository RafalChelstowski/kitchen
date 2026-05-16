import { produce } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { useShallow } from 'zustand/react/shallow';

import { State } from '../types';

export const initialState = {
  gfxSettings: {
    surroundings: true,
    lights: 2,
    glass: true,
  },
  coffeeState: null,
  letters: {},
  achievements: {},
  playerStatus: null,
  isLocked: false,
  pointerSpeed: '0.2',
};

const useStoreImpl = create<State>()(
  devtools(
    (set) => ({
      ...initialState,
      setAchievement: (name, payload) => {
        set(
          produce<State>((state) => {
            state.achievements[name] = payload;
          })
        );
      },
      setAchievements: (achievements) => {
        set(() => ({ achievements }));
      },
      toggleIsLocked: () => set((state) => ({ isLocked: !state.isLocked })),
      setPlayerStatus: (status) => set(() => ({ playerStatus: status })),
    }),
    { name: 'kitchenStore' }
  )
);

export { shallow };

const useStore = Object.assign(
  <T>(selector: (state: State) => T): T => useStoreImpl(useShallow(selector)),
  useStoreImpl
);

const { getState, setState, subscribe } = useStoreImpl;

export { getState, setState, subscribe, useStore };
