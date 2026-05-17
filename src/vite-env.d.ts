/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly VITE_API_KEY: string;
  readonly VITE_APP_ID: string;
  readonly VITE_AUTH_DOMAIN: string;
  readonly VITE_DATABASE_URL: string;
  readonly VITE_MEASUREMENT_ID: string;
  readonly VITE_MESSAGING_SENDER_ID: string;
  readonly VITE_PROJECT_ID: string;
  readonly VITE_STORAGE_BUCKET: string;
  readonly VITE_TEST_EMAIL: string;
  readonly VITE_TEST_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
