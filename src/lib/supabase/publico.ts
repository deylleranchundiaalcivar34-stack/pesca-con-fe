import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Cliente anonimo para lecturas publicas; no usa cookies ni vuelve dinamicas las rutas.
export function createPublicClient() {
  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createSupabaseClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
