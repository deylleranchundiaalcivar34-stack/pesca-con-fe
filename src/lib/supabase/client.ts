import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createClient() {
  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
  );
}
