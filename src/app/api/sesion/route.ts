import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit, getRequestAddress } from "@/lib/rate-limit";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getPublicUserSummary } from "@/lib/usuario";
import type { PublicUserSummary } from "@/types/usuario";

const noStoreHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};

// Devuelve el resumen de sesion usado por el header publico.
export async function GET(request: NextRequest) {
  const allowed = await consumeRateLimit({
    bucket: "public.session",
    identifier: getRequestAddress(request.headers),
    max: 90,
    windowSeconds: 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { user: null },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": "60" } },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ user: null }, { headers: noStoreHeaders });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // @supabase/ssr elimina las cookies cuando el refresh token ya no existe.
  // La API pública debe tratar esa situación como una sesión cerrada, no como 500.
  if (userError || !user) {
    return NextResponse.json({ user: null }, { headers: noStoreHeaders });
  }

  const { data: adminProfile } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  const summary: PublicUserSummary = {
    ...getPublicUserSummary(user),
    isAdmin: Boolean(adminProfile),
  };

  return NextResponse.json({ user: summary }, { headers: noStoreHeaders });
}
