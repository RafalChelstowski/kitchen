import isEmpty from 'lodash/isEmpty';

import { useStore } from '../../store/store';
import {
  AchievementDescriptions,
  AchievementName,
  AchievementPayloadStatus,
  Achievements as AchievementsType,
} from '../../types';
import { achievementCatalog } from './achievementCatalog';

const cellClassName = 'p-6';

interface PlayerAchievementsProps {
  achievements: AchievementsType;
  achievementsDescriptions: AchievementDescriptions;
}

export function PlayerAchievements({
  achievements,
  achievementsDescriptions,
}: PlayerAchievementsProps): JSX.Element {
  const markAchievementViewed = useStore(
    (state) => state.markAchievementViewed
  );

  return (
    <>
      {Object.entries(achievements).map(([k], i) => {
        const name = k as AchievementName;
        const { fullName, description } = achievementsDescriptions[name];
        const { date, status } = achievements[name] || {
          date: '-',
          status: AchievementPayloadStatus.VIEWED,
        };
        const isNew = status === AchievementPayloadStatus.NEW;

        return (
          // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
          <div
            onMouseOver={() => {
              if (isNew) {
                markAchievementViewed(name);
              }
            }}
            key={k}
            className={`flex flex-row font-semibold text-lg transition-colors duration-1000 ${
              isNew ? 'bg-tGreen/20' : 'bg-transparent'
            } text-white`}
          >
            <div className={`w-1/6 ${cellClassName}`}>{`${i + 1}.`}</div>
            <div className={`w-1/6 font-black ${cellClassName}`}>
              {fullName}
            </div>
            <div className={`w-3/6 ${cellClassName}`}>{description}</div>
            <div className={`w-1/6 ${cellClassName}`}>{date}</div>
          </div>
        );
      })}
    </>
  );
}

export function Achievements(): JSX.Element {
  const achievements = useStore((state) => state.achievements);
  const noAchievements = isEmpty(achievements);

  const achievementsDescriptions = achievementCatalog;
  const achievementTotal = Object.keys(achievementCatalog).length;
  const isFetching = false;

  if (!achievementsDescriptions || noAchievements || isFetching) {
    return (
      <div className="flex-col items-center w-full mt-10 font-semibold text-lg">
        {isFetching ? 'Loading...' : 'No achievements...'}
      </div>
    );
  }

  return (
    <div className="flex-col items-center w-full my-10 overflow-y-auto">
      <div className="flex flex-row">
        <div className="text-lg font-black p-6">
          {isFetching
            ? 'Loading...'
            : `Achievements collected: ${
                Object.entries(achievements).length
              }/${achievementTotal}`}
        </div>
      </div>
      <PlayerAchievements
        achievements={achievements}
        achievementsDescriptions={achievementsDescriptions}
      />
    </div>
  );
}
