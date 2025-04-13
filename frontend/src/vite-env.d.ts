/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_MOCK_API: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 