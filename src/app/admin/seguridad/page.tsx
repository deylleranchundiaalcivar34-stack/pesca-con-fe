import { ShieldCheck } from "lucide-react";
import { AdminMfa } from "@/components/admin/admin-mfa";
import { requireAdmin } from "@/lib/supabase/admin-auth";

function safeNext(value?: string | string[]) {
  const next = Array.isArray(value) ? value[0] : value;
  return next?.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  await requireAdmin("admin.access", { requireAal2: false });
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">
            Seguridad administrativa
          </h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          El panel exige un código temporal además de la contraseña para proteger pedidos,
          inventario y datos personales.
        </p>
      </div>

      <AdminMfa nextPath={safeNext(params.next)} />
    </div>
  );
}
