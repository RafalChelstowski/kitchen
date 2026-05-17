import { Link, useLocation } from 'wouter';

export const HOME = '/';
export const SIGN_UP = '/signup';
export const SIGN_IN = '/signin';
export const SIGN_OUT = '/signout';
export const ACCOUNT = '/account';
export const SETTINGS = '/settings';
export const ACHIEVEMENTS = '/achievements';
export const PASSWORD_FORGET = '/pw-forget';

export const routes = {
  HOME,
  SIGN_UP,
  SIGN_IN,
  SIGN_OUT,
  ACCOUNT,
  SETTINGS,
  ACHIEVEMENTS,
  PASSWORD_FORGET,
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
