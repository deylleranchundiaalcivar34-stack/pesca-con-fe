import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Crea el cliente Supabase del servidor usando cookies de Next.
export async function createClient() {
  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    throw new Error("Missing Supabase public environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; Proxy refreshes the session.
          }
        },
      },
    },
  );
}
