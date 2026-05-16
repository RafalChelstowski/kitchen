import { Link, useLocation } from 'wouter';

import { userApi } from '../api';
import { useUser } from '../api/hooks/useUser';
import { SignOutButton } from './user/SignOutButton';

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
  const isDev = import.meta.env.DEV;
  const { uid } = useUser();
  const [location] = useLocation();

  return (
    <nav className="mt-10">
      {location !== HOME ? (
        <Link className="nav-link" to={HOME}>
          ← Home
        </Link>
      ) : (
        <>
          {uid ? (
            <>
              <Link className="nav-link" to={ACCOUNT}>
                Account
              </Link>
              <Link className="nav-link" to={SETTINGS}>
                Settings
              </Link>
              <Link className="nav-link" to={ACHIEVEMENTS}>
                Achievements
              </Link>
              <SignOutButton route={routes.HOME} />
            </>
          ) : (
            <>
              <Link className="nav-link" to={SIGN_IN}>
                Log In
              </Link>
              <Link className="nav-link" to={SIGN_UP}>
                Create account
              </Link>
              <Link className="nav-link" to={SETTINGS}>
                Settings
              </Link>
              <Link className="nav-link" to={ACHIEVEMENTS}>
                Achievements
              </Link>
            </>
          )}
        </>
      )}

      {isDev && !uid && (
        <button
          className="nav-link flex text-red-600"
          type="button"
          onClick={() => {
            userApi.signInTestUser();
          }}
        >
          Admin
        </button>
      )}
    </nav>
  );
}
