# Repository Guidelines

## Project Structure & Module Organization

The application is a Vite-powered React and TypeScript 3D experience. `src/index.tsx` starts the app, while `src/App.tsx` assembles the React Three Fiber scene. Place domain code under `src/features/`, API hooks under `src/api/`, shared components and hooks under `src/common/`, Zustand state in `src/store/`, and shared types in `src/types/`. Keep tests beside the code they cover with a `.test.ts` or `.test.tsx` suffix. Static GLTF models, textures, HDR files, and web metadata belong in `public/`. Build and test configuration stays at the repository root. Before changing physics integration or colliders, read `docs/physics-migration.md`.

## Build, Test, and Development Commands

Run `corepack enable` once before the first install. The `packageManager` field in `package.json` pins the required pnpm version.

- `pnpm install` installs dependencies from `pnpm-lock.yaml`.
- `pnpm dev` starts the Vite development server with hot reload.
- `pnpm build` creates the production bundle.
- `pnpm typecheck` runs strict TypeScript checks without emitting files.
- `pnpm test` runs the Vitest suite once.

No lint script is currently configured. Run both `pnpm typecheck` and `pnpm test` before opening a pull request.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: two-space indentation, semicolons, single quotes, and trailing commas in multiline structures. Use PascalCase for React components and component files, `useX` names for hooks, and camelCase for variables and functions. Prefer functional components and named exports. Keep scene-specific logic within its feature directory; move genuinely reusable UI, materials, or hooks into `src/common/`. Use Tailwind utility classes for layout and presentation, with shared theme values defined in `src/index.css` or `tailwind.config.js`.

## Testing Guidelines

Tests use Vitest, jsdom, React Testing Library, and matchers registered in `src/setupTests.ts`. Test observable behavior rather than implementation details. Mock WebGL, React Three Fiber, or physics boundaries when a unit test does not require real rendering. No coverage threshold is configured; add a focused regression test for changed behavior when practical.

## Commit & Pull Request Guidelines

Recent history favors short descriptive subjects, with newer squash commits using `kitchen: <summary>` (for example, `kitchen: adjust player collision`). Keep each commit focused. Pull requests should explain the user-visible change, list validation commands, and link related issues. Include screenshots or a short recording for UI, animation, lighting, or 3D interaction changes. Call out new or replaced assets and any effects on bundle size, performance, or browser-stored progress.
