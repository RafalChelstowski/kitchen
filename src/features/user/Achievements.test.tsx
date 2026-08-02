import { fireEvent, render, screen } from '@testing-library/react';

import { getState, initialState, setState } from '../../store/store';
import {
  AchievementName,
  AchievementPayloadStatus,
} from '../../types';

import { Achievements } from './Achievements';

const fridgeDate = '2026-05-16';
const coffeeDate = '2026-05-17';

function resetStore(): void {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
}

beforeEach(resetStore);

test('shows the empty state when no achievements have been collected', () => {
  render(<Achievements />);

  expect(screen.getByText('No achievements...')).toBeInTheDocument();
});

test('shows catalog details and the collected total for populated achievements', () => {
  setState({
    achievements: {
      [AchievementName.FRIDGE]: {
        date: fridgeDate,
        status: AchievementPayloadStatus.VIEWED,
      },
    },
  });

  render(<Achievements />);

  expect(screen.getByText('Achievements collected: 1/9')).toBeInTheDocument();
  expect(screen.getByText('Fridge door')).toBeInTheDocument();
  expect(
    screen.getByText(
      "If you don't like what you've found inside - maybe throw it outside?"
    )
  ).toBeInTheDocument();
  expect(screen.getByText(fridgeDate)).toBeInTheDocument();
});

test('marks a new achievement viewed on hover without changing its date', () => {
  setState({
    achievements: {
      [AchievementName.FRIDGE]: {
        date: fridgeDate,
        status: AchievementPayloadStatus.NEW,
      },
      [AchievementName.COFFEE]: {
        date: coffeeDate,
        status: AchievementPayloadStatus.VIEWED,
      },
    },
  });

  render(<Achievements />);

  fireEvent.mouseOver(screen.getByText('Fridge door'));

  expect(getState().achievements[AchievementName.FRIDGE]).toEqual({
    date: fridgeDate,
    status: AchievementPayloadStatus.VIEWED,
  });

  fireEvent.mouseOver(screen.getByText('Barista'));

  expect(getState().achievements[AchievementName.COFFEE]).toEqual({
    date: coffeeDate,
    status: AchievementPayloadStatus.VIEWED,
  });
});
