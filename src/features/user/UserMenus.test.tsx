import { act, render, screen } from '@testing-library/react';

import { Crosshair } from '../Crosshair';
import { getState, initialState, setState } from '../../store/store';

import { UserMenus } from './UserMenus';

function resetStore(): void {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
}

function renderPointerLockUi(): void {
  render(
    <>
      <UserMenus />
      <Crosshair />
    </>
  );
}

beforeEach(resetStore);

test('shows the home menu and instructions while unlocked', () => {
  renderPointerLockUi();

  expect(screen.getByText('Kitchen')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'START' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Achievements' })
  ).toBeInTheDocument();
  expect(screen.getByText('move')).toBeInTheDocument();
  expect(screen.getByText('open / pick / interact')).toBeInTheDocument();
  expect(screen.getByText('throw')).toBeInTheDocument();
  expect(screen.getByText('exit')).toBeInTheDocument();
  expect(screen.queryByTestId('crosshair')).not.toBeInTheDocument();
});

test('replaces the menu with the crosshair while locked', () => {
  setState({ isLocked: true });
  renderPointerLockUi();

  expect(screen.queryByRole('main')).not.toBeInTheDocument();
  expect(screen.getByTestId('crosshair')).toBeInTheDocument();
});

test('updates the menu and crosshair when lock state changes', () => {
  renderPointerLockUi();

  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.queryByTestId('crosshair')).not.toBeInTheDocument();

  act(() => {
    getState().setIsLocked(true);
  });

  expect(screen.queryByRole('main')).not.toBeInTheDocument();
  expect(screen.getByTestId('crosshair')).toBeInTheDocument();

  act(() => {
    getState().setIsLocked(false);
  });

  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.queryByTestId('crosshair')).not.toBeInTheDocument();
});
