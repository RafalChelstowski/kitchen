export type FirebaseApp = never;

export type UserCredential = {
  user: {
    uid: string;
  } | null;
};

export type User = {
  uid: string;
  displayName?: string | null;
};
