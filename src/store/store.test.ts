import {
  AchievementName,
  AchievementPayloadStatus,
  PlayerStatus,
} from '../types';

import { getState, initialState, setState, STORE_PERSISTENCE_KEY } from './store';

beforeEach(() => {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
});

test('persists achievements and preferences without transient state', () => {
  const achievement = {
    date: '2026-05-16T00:00:00.000Z',
    status: AchievementPayloadStatus.NEW,
  };

  getState().setAchievement(AchievementName.FRIDGE, achievement);
  setState({
    coffeeState: 'ready',
    letters: { t: true },
    playerStatus: PlayerStatus.PICKED,
    isLocked: true,
    gfxSettings: {
      surroundings: false,
      lights: 1,
      glass: false,
    },
    pointerSpeed: '0.7',
  });

  const storedValue = localStorage.getItem(STORE_PERSISTENCE_KEY);
  const persisted = JSON.parse(storedValue ?? '{}');

  expect(persisted.state).toEqual({
    achievements: {
      [AchievementName.FRIDGE]: achievement,
    },
    gfxSettings: {
      surroundings: false,
      lights: 1,
      glass: false,
    },
    pointerSpeed: '0.7',
  });
  expect(persisted.state).not.toHaveProperty('coffeeState');
  expect(persisted.state).not.toHaveProperty('letters');
  expect(persisted.state).not.toHaveProperty('playerStatus');
  expect(persisted.state).not.toHaveProperty('isLocked');
});

test('marks achievement viewed while preserving original date', () => {
  const achievement = {
    date: '2026-05-16T00:00:00.000Z',
    status: AchievementPayloadStatus.NEW,
  };

  getState().setAchievement(AchievementName.FRIDGE, achievement);
  getState().markAchievementViewed(AchievementName.FRIDGE);

  expect(getState().achievements[AchievementName.FRIDGE]).toEqual({
    date: achievement.date,
    status: AchievementPayloadStatus.VIEWED,
  });
});
