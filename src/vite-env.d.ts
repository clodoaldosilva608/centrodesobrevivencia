/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OSIRIS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
