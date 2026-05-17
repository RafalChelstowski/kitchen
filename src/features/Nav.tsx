import { Link, useLocation } from 'wouter';

export const HOME = '/';
export const SETTINGS = '/settings';
export const ACHIEVEMENTS = '/achievements';

export const routes = {
  HOME,
  SETTINGS,
  ACHIEVEMENTS,
};

export function Nav(): JSX.Element | null {
  const [location] = useLocation();

  return (
    <nav className="mt-10">
      {location !== HOME ? (
        <Link className="nav-link" to={HOME}>
          ← Home
        </Link>
      ) : (
        <>
          <Link className="nav-link" to={SETTINGS}>
            Settings
          </Link>
          <Link className="nav-link" to={ACHIEVEMENTS}>
            Achievements
          </Link>
        </>
      )}
    </nav>
  );
}
