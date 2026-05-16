import { UserCredential } from '../types';
import { firebase } from './firebase';

export const auth = firebase.auth();

if (window.location.hostname === 'localhost') {
  auth.useEmulator('http://localhost:9099');
}

const signInTestUser = (): Promise<UserCredential> => {
  const email = import.meta.env.VITE_TEST_EMAIL;
  const password = import.meta.env.VITE_TEST_PASSWORD;

  return auth.signInWithEmailAndPassword(email, password);
};

const doCreateUserWithEmailAndPassword = (
  email: string,
  password: string
): Promise<UserCredential> =>
  auth.createUserWithEmailAndPassword(email, password);

const updateUserDisplayName = (
  displayName: string
): Promise<void> | undefined =>
  auth.currentUser?.updateProfile({ displayName });

const doSignInWithEmailAndPassword = (
  email: string,
  password: string
): Promise<UserCredential> => auth.signInWithEmailAndPassword(email, password);

const doSignOut = (): Promise<void> => auth.signOut();

const doPasswordReset = (email: string): Promise<void> =>
  auth.sendPasswordResetEmail(email);

const doPasswordUpdate = (password: string): Promise<void> | void => {
  if (auth.currentUser) {
    auth.currentUser?.updatePassword(password);
  }
};

const userApi = {
  auth,
  signInTestUser,
  doCreateUserWithEmailAndPassword,
  updateUserDisplayName,
  doSignInWithEmailAndPassword,
  doSignOut,
  doPasswordReset,
  doPasswordUpdate,
};

export { userApi };
