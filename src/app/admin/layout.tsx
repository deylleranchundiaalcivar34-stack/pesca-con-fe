import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary">
      {/* TODO: Proteger este layout con Supabase Auth, roles admin y RLS. */}
      <div className="flex">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminHeader />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
