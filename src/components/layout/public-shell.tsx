import type { ReactNode } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getPublicUserSummary } from "@/lib/user";
import type { PublicUserSummary } from "@/types/user";
import { Footer } from "./footer";
import { Header } from "./header";

async function getCurrentUser(): Promise<PublicUserSummary | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: adminProfile } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  return {
    ...getPublicUserSummary(user),
    isAdmin: Boolean(adminProfile),
  };
}

export async function PublicShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
