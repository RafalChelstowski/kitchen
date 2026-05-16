import { ChangeEvent, FormEvent, useState } from 'react';

import { Link } from 'wouter';

import { userApi } from '../../api';
import { routes } from '../Nav';

export interface SignUpFormData {
  username: string;
  email: string;
  passwordOne: string;
  passwordTwo: string;
  error: Error | null;
}

const INITIAL_STATE: SignUpFormData = {
  username: '',
  email: '',
  passwordOne: '',
  passwordTwo: '',
  error: null,
};

function SignUpForm(): JSX.Element {
  const [formState, setFormsState] = useState<SignUpFormData>(
    () => INITIAL_STATE
  );
  const { username, email, passwordOne, passwordTwo, error } = formState;

  const isInvalid =
    passwordOne !== passwordTwo ||
    passwordOne === '' ||
    email === '' ||
    username === '';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const newUser = await userApi.doCreateUserWithEmailAndPassword(
        email,
        passwordOne
      );

      await userApi.updateUserDisplayName(username);

      if (!newUser.user) {
        throw new Error('something went wrong while adding user');
      }
    } catch (err) {
      setFormsState({ ...formState, error: err as Error });
    }
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <input
          className="text-input"
          name="username"
          type="text"
          value={username}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormsState({ ...formState, username: event.target.value })
          }
          placeholder="Username"
        />
        <br />
        <input
          className="text-input"
          name="email"
          type="email"
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormsState({ ...formState, email: event.target.value })
          }
          placeholder="e-mail"
        />
        <br />
        <input
          className="text-input"
          name="passwordOne"
          type="password"
          value={passwordOne}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormsState({ ...formState, passwordOne: event.target.value })
          }
          placeholder="Password"
        />
        <br />
        <input
          className="text-input"
          name="passwordTwo"
          type="password"
          value={passwordTwo}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFormsState({ ...formState, passwordTwo: event.target.value })
          }
          placeholder="Confirm Password"
        />
        <br />
        <div className="my-6 w-full justify-center flex place-content-center">
          <button className="cta" disabled={isInvalid} type="submit">
            Sign Up
          </button>
        </div>

        <div>{error && <p>{error.message}</p>}</div>
      </form>
    </>
  );
}

export function SignUpPage(): JSX.Element {
  return (
    <div className="flex flex-col w-full place-content-center place-items-center">
      <div className="font-semibold text-lg">Create new account:</div>
      <SignUpForm />
    </div>
  );
}

export function SignUpPageLink(): JSX.Element {
  return (
    <p>
      <Link to={routes.SIGN_UP}>Create account</Link>
    </p>
  );
}
