interface LocalUserCredential {
  user: {
    uid: string;
  };
}

const createLocalCredential = (): LocalUserCredential => ({
  user: {
    uid: 'local-user',
  },
});

const resolvedAuthAction = async (): Promise<void> => undefined;

export const userApi = {
  auth: {
    currentUser: null,
  },
  signInTestUser: async (): Promise<LocalUserCredential> =>
    createLocalCredential(),
  doCreateUserWithEmailAndPassword: async (
    _email: string,
    _password: string
  ): Promise<LocalUserCredential> => createLocalCredential(),
  updateUserDisplayName: async (_displayName: string): Promise<void> =>
    resolvedAuthAction(),
  doSignInWithEmailAndPassword: async (
    _email: string,
    _password: string
  ): Promise<LocalUserCredential> => createLocalCredential(),
  doSignOut: resolvedAuthAction,
  doPasswordReset: async (_email: string): Promise<void> =>
    resolvedAuthAction(),
  doPasswordUpdate: async (_password: string): Promise<void> =>
    resolvedAuthAction(),
};
