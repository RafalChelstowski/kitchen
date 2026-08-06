import { fireEvent, render, screen } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { Router } from 'wouter';
import type { BaseLocationHook } from 'wouter';

import { ACHIEVEMENTS, HOME, Nav, SETTINGS } from './Nav';

type MemoryLocation = {
  current: string;
  hook: BaseLocationHook;
};

function createMemoryLocation(initialPath: string): MemoryLocation {
  let current = initialPath;
  const listeners = new Set<() => void>();

  const navigate = (path: string): void => {
    current = path;
    listeners.forEach((listener) => listener());
  };

  const useMemoryLocation: BaseLocationHook = () => {
    const location = useSyncExternalStore(
      (listener) => {
        listeners.add(listener);

        return () => listeners.delete(listener);
      },
      () => current,
      () => initialPath
    );

    return [location, navigate];
  };

  return {
    get current() {
      return current;
    },
    hook: useMemoryLocation,
  };
}

function renderNav(initialPath: string): MemoryLocation {
  const memoryLocation = createMemoryLocation(initialPath);

  render(
    <Router hook={memoryLocation.hook}>
      <Nav />
    </Router>
  );

  return memoryLocation;
}

test('home shows settings and achievements links without a home link', () => {
  renderNav(HOME);

  expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Achievements' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /home/i })
  ).not.toBeInTheDocument();
});

test.each([SETTINGS, ACHIEVEMENTS])(
  '%s shows only the contextual home link',
  (initialPath) => {
    renderNav(initialPath);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Settings' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Achievements' })
    ).not.toBeInTheDocument();
  }
);

test.each([
  ['Settings', SETTINGS],
  ['Achievements', ACHIEVEMENTS],
] as const)('navigates from home to %s', (linkName, expectedRoute) => {
  const memoryLocation = renderNav(HOME);

  fireEvent.click(screen.getByRole('link', { name: linkName }));

  expect(memoryLocation.current).toBe(expectedRoute);
  expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: /home/i }));

  expect(memoryLocation.current).toBe(HOME);
});
