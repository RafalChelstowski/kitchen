import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { App } from './App';

vi.mock('@react-three/cannon', () => ({
  Debug: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Physics: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@react-three/rapier', () => ({
  CuboidCollider: () => null,
  CylinderCollider: () => null,
  Physics: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RigidBody: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@react-three/drei', () => ({
  AdaptiveDpr: () => null,
  Loader: () => null,
  Preload: () => null,
  Stats: () => null,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
}));

vi.mock('./common/components/Lights', () => ({
  Lights: () => null,
}));

vi.mock('./features/Crosshair', () => ({
  Crosshair: () => null,
}));

vi.mock('./features/kitchen/Bounds', () => ({
  StaticBounds: () => null,
}));

vi.mock('./features/kitchen/Emissive', () => ({
  Emissive: () => null,
}));

vi.mock('./features/kitchen/Env', () => ({
  Env: () => null,
}));

vi.mock('./features/kitchen/Floor', () => ({
  Floor: () => null,
}));

vi.mock('./features/kitchen/Glass', () => ({
  Glass: () => null,
}));

vi.mock('./features/kitchen/interactive/Cupboard', () => ({
  Cupboard: () => null,
}));

vi.mock('./features/kitchen/interactive/Drawer', () => ({
  Drawer: () => null,
}));

vi.mock('./features/kitchen/interactive/Express', () => ({
  Express: () => null,
}));

vi.mock('./features/kitchen/interactive/Fridge', () => ({
  Fridge: () => null,
}));

vi.mock('./features/kitchen/interactive/Harnas', () => ({
  Harnas: () => null,
}));

vi.mock('./features/kitchen/interactive/Letters', () => ({
  Letters: () => null,
}));

vi.mock('./features/kitchen/interactive/Microvawe', () => ({
  Microwave: () => null,
}));

vi.mock('./features/kitchen/interactive/Neon', () => ({
  Neon: () => null,
}));

vi.mock('./features/kitchen/interactive/Transform', () => ({
  Transform: () => null,
}));

vi.mock('./features/kitchen/interactive/Window', () => ({
  InteractiveWindow: () => null,
}));

vi.mock('./features/kitchen/KitchenModel', () => ({
  KitchenModel: () => null,
}));

vi.mock('./features/kitchen/Mugs', () => ({
  Mugs: () => null,
}));

vi.mock('./features/kitchen/Surroundings', () => ({
  Surroundings: () => null,
}));

vi.mock('./features/player/Player', () => ({
  Player: () => null,
}));

test('renders the app shell', () => {
  const { getByText, getByTestId } = render(<App />);

  expect(getByTestId('canvas')).toBeInTheDocument();
  expect(getByText('Kitchen')).toBeInTheDocument();
});
