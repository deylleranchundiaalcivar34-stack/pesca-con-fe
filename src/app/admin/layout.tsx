import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/barra-lateral-admin";

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
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-secondary">
      <div className="flex min-w-0">
        <AdminSidebar />
        <div className="min-w-0 flex-1 overflow-x-hidden">
          <main className="w-full max-w-full overflow-x-hidden px-3 pb-6 pt-20 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
