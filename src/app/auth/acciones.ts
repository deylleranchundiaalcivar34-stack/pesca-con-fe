"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cierra la sesion actual y lleva al usuario al login.
export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/");
}
