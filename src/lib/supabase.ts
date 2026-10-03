import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

/**
 * Cliente Supabase do Centro de Sobrevivência.
 *
 * Variáveis de ambiente:
 *   VITE_SUPABASE_URL      — URL do projeto (https://<ref>.supabase.co)
 *   VITE_SUPABASE_ANON_KEY — Chave anônima ( pública, ok para o front-end )
 *
 * RLS protege todas as tabelas — a chave anônima só consegue ler catálogos
 * (products/ebooks/games/challenges) e mexer nos próprios dados do usuário
 * logado (waypoints, routes, achievements, etc.). Operações de admin
 * (CRUD de produtos) só passam se o usuário logado tiver is_admin=TRUE.
 *
 * A chave service_role NUNCA deve ir para o front-end.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://mbterwktxczsyevcudoz.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? "sb_publishable_ryJL0JbkpT8farKwPC_Mjw_Jiyx0N7M";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[supabase] Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas — usando defaults");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 2 },
  },
});

export default supabase;
