import "server-only";

import type { AdminPermission } from "@/lib/admin-permissions";
import { hasAdminPermission, isAdminRole } from "@/lib/admin-permissions";
import { createClient } from "@/lib/supabase/server";

// Centraliza la autorizacion administrativa para paginas y acciones sensibles.
export async function requireAdmin(
  permission: AdminPermission = "admin.access",
  options: { requireAal2?: boolean } = {},
) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  const aal = claimsData?.claims.aal;

  if (claimsError || !userId) {
    throw new Error("No autenticado.");
  }

  const { data: admin, error: adminError } = await supabase
    .from("perfiles_admin")
    .select("id, rol")
    .eq("id", userId)
    .eq("activo", true)
    .maybeSingle();

  if (
    adminError ||
    !admin ||
    !isAdminRole(admin.rol) ||
    !hasAdminPermission(admin.rol, permission)
  ) {
    throw new Error("No autorizado.");
  }

  if (options.requireAal2 !== false && aal !== "aal2") {
    throw new Error("Se requiere verificacion en dos pasos.");
  }

  return { supabase, userId, role: admin.rol, aal };
}
