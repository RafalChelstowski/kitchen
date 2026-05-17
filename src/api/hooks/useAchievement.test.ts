import { toast } from 'react-toastify';

import { getState, initialState, setState } from '../../store/store';
import { AchievementName, AchievementPayloadStatus } from '../../types';

import { useAchievement } from './useAchievement';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

test('adds a new achievement once without overwriting existing payload', async () => {
  const { addAchievement } = useAchievement();

  await addAchievement(AchievementName.COFFEE);

  const firstPayload = getState().achievements[AchievementName.COFFEE];

  expect(firstPayload).toEqual({
    date: new Date('2026-05-16T12:00:00.000Z').toDateString(),
    status: AchievementPayloadStatus.NEW,
  });
  expect(toast.success).toHaveBeenCalledTimes(1);
  expect(toast.success).toHaveBeenCalledWith('New achievement!');

  vi.setSystemTime(new Date('2026-05-17T12:00:00.000Z'));

  await addAchievement(AchievementName.COFFEE);

  expect(getState().achievements[AchievementName.COFFEE]).toBe(firstPayload);
  expect(toast.success).toHaveBeenCalledTimes(1);
});
