import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/barra-lateral-admin";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export const metadata: Metadata = {
  title: {
    default: "Panel administrador",
    template: "%s | Admin Pesca Con Fe",
  },
  robots: {
    index: false,
    follow: false,
  },
};

// Layout del panel admin con sidebar fijo y area principal.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await requireAdmin("admin.access", { requireAal2: false });

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-secondary">
      <div className="flex min-w-0">
        <AdminSidebar role={role} />
        <div className="min-w-0 flex-1 overflow-x-hidden lg:ml-72">
          <main className="w-full max-w-full overflow-x-hidden px-3 pb-6 pt-20 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
