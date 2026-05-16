import { useState } from 'react';

import isEmpty from 'lodash/isEmpty';

import { useUser } from '../../api/hooks/useUser';
import { useStore } from '../../store/store';
import {
  AchievementDescriptions,
  AchievementName,
  AchievementPayload,
  AchievementPayloadStatus,
  Achievements as AchievementsType,
} from '../../types';

const cellClassName = 'p-6';

type AchievementMode = 'player' | 'global';

interface PlayerAchievementsProps {
  achievements: Partial<Record<AchievementName, AchievementPayload>>;
  achievementsDescriptions: AchievementDescriptions;
}

export function PlayerAchievements({
  achievements,
  achievementsDescriptions,
}: PlayerAchievementsProps): JSX.Element {
  const { uid } = useUser();

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
            key={k}
            className={`flex flex-row font-semibold text-lg transition-colors duration-1000 ${
              isNew && uid ? 'text-tGreen' : 'text-white'
            }`}
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

function GlobalAchievements() {
  return null;
}

export function Achievements(): JSX.Element {
  const achievements = useStore((state) => state.achievements);
  const noAchievements = isEmpty(achievements);
  const user = useUser();
  const [achievementsView, setAchievementsView] =
    useState<AchievementMode>('player');

  const achievementsDescriptions = Object.fromEntries(
    Object.keys(achievements).map((name) => [
      name,
      {
        fullName: name,
        description: '',
      },
    ])
  ) as AchievementDescriptions;
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
        <div className="flex w-1/2">
          <div className="text-lg font-black p-6">
            {isFetching
              ? 'Loading...'
              : `Achievements collected: ${
                  Object.entries(achievements).length
                }/${Object.entries(achievementsDescriptions).length}`}
          </div>
        </div>
        <div className="flex w-1/2 place-items-center">
          {user.uid ? (
            <button
              className="bg-tGreen font-semibold text-sm py-1 px-10 h-10"
              type="button"
              name="toggle achievements mode"
              onClick={() =>
                setAchievementsView(
                  achievementsView === 'player' ? 'global' : 'player'
                )
              }
            >
              {achievementsView === 'player' ? 'Global' : 'Local'}
            </button>
          ) : null}
        </div>
      </div>
      {achievementsView === 'player' ? (
        <PlayerAchievements
          achievements={achievements}
          achievementsDescriptions={achievementsDescriptions}
        />
      ) : (
        <GlobalAchievements />
      )}
    </div>
  );
}
