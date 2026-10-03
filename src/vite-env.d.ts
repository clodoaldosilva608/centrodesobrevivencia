/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OSIRIS_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_MANUAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
