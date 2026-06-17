import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getPublicUserSummary } from "@/lib/usuario";
import type { PublicUserSummary } from "@/types/usuario";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

// Devuelve el resumen de sesion usado por el header publico.
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ user: null }, { headers: noStoreHeaders });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
