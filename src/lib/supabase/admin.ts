import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Cliente privilegiado exclusivo para callbacks y operaciones internas.
// Nunca comparte cookies ni sesiones del navegador.
export function createAdminClient() {
  const supabaseEnv = getSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseEnv || !secretKey) {
    throw new Error("Missing Supabase server credentials.");
  }

  return createSupabaseClient(supabaseEnv.supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
