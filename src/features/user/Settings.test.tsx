import { fireEvent, render, screen } from '@testing-library/react';

import {
  getState,
  initialState,
  setState,
  STORE_PERSISTENCE_KEY,
} from '../../store/store';
import type { GfxSettings } from '../../types';

import { SettingsPage } from './Settings';

const presets: Array<{ name: string; settings: GfxSettings }> = [
  {
    name: 'Low',
    settings: {
      surroundings: false,
      lights: 1,
      glass: false,
    },
  },
  {
    name: 'Medium',
    settings: {
      surroundings: true,
      lights: 2,
      glass: true,
    },
  },
  {
    name: 'High',
    settings: {
      surroundings: true,
      lights: 3,
      glass: true,
    },
  },
];

function resetStore(): void {
  localStorage.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
}

function expectRenderedSettings(settings: GfxSettings): void {
  expect(
    screen.getByRole('checkbox', { name: /surroundings/i })
  ).toHaveProperty('checked', settings.surroundings);
  expect(screen.getByRole('combobox', { name: /lights/i })).toHaveValue(
    String(settings.lights)
  );
  expect(screen.getByRole('checkbox', { name: /glass/i })).toHaveProperty(
    'checked',
    settings.glass
  );
}

function expectPersistedSettings(settings: GfxSettings): void {
  const persisted = JSON.parse(
    localStorage.getItem(STORE_PERSISTENCE_KEY) ?? '{}'
  ) as { state?: { gfxSettings?: GfxSettings } };

  expect(persisted.state?.gfxSettings).toEqual(settings);
}

beforeEach(resetStore);

test.each(presets)('$name preset applies all graphics settings', ({ name, settings }) => {
  render(<SettingsPage />);

  fireEvent.click(screen.getByRole('button', { name }));

  expect(getState().gfxSettings).toEqual(settings);
  expectRenderedSettings(settings);
  expectPersistedSettings(settings);
});

test('surroundings checkbox updates only surroundings and persists the change', () => {
  const expectedSettings: GfxSettings = {
    ...initialState.gfxSettings,
    surroundings: false,
  };

  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('checkbox', { name: /surroundings/i }));

  expect(getState().gfxSettings).toEqual(expectedSettings);
  expectRenderedSettings(expectedSettings);
  expectPersistedSettings(expectedSettings);
});

test('lights selector updates only lights and persists the change', () => {
  const expectedSettings: GfxSettings = {
    ...initialState.gfxSettings,
    lights: 3,
  };

  render(<SettingsPage />);
  fireEvent.change(screen.getByRole('combobox', { name: /lights/i }), {
    target: { value: String(expectedSettings.lights) },
  });

  expect(getState().gfxSettings).toEqual(expectedSettings);
  expectRenderedSettings(expectedSettings);
  expectPersistedSettings(expectedSettings);
});

test('glass checkbox updates only glass and persists the change', () => {
  const expectedSettings: GfxSettings = {
    ...initialState.gfxSettings,
    glass: false,
  };

  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('checkbox', { name: /glass/i }));

  expect(getState().gfxSettings).toEqual(expectedSettings);
  expectRenderedSettings(expectedSettings);
  expectPersistedSettings(expectedSettings);
});
