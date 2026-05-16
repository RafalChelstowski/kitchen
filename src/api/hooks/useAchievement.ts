import { toast } from 'react-toastify';

import isUndefined from 'lodash/isUndefined';

import { getState, setState } from '../../store/store';
import { AchievementName, AchievementPayloadStatus } from '../../types';

export function useAchievement(): {
  addAchievement: (name: AchievementName) => Promise<void>;
} {
  const addAchievement = async (name: AchievementName) => {
    const { achievements } = getState();

    if (!isUndefined(achievements[name])) {
      return;
    }

    const payload = {
      date: new Date().toDateString(),
      status: AchievementPayloadStatus.NEW,
    };

    setState({ achievements: { ...achievements, [name]: payload } });
    toast.success('New achievement!');
  };

  return { addAchievement };
}
