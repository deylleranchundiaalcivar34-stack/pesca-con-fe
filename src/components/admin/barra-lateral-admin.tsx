"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FileSpreadsheet,
  Home,
  LogOut,
  Menu,
  PackagePlus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Tags,
} from "lucide-react";
import { logout } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AdminPermission, AdminRole } from "@/lib/admin-permissions";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { cn } from "@/lib/utilidades";

const adminLinks: Array<{
  href: string;
  label: string;
  icon: typeof BarChart3;
  permission: AdminPermission;
}> = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, permission: "dashboard.read" },
  { href: "/admin/productos", label: "Productos", icon: Boxes, permission: "catalog.write" },
  { href: "/admin/productos/nuevo", label: "Crear producto", icon: PackagePlus, permission: "catalog.write" },
  { href: "/admin/marcas", label: "Marcas", icon: Tags, permission: "catalog.write" },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, permission: "orders.read" },
  { href: "/admin/ventas-fisicas", label: "Venta física", icon: ReceiptText, permission: "sales.create" },
  { href: "/admin/inventario", label: "Exportar inventario", icon: FileSpreadsheet, permission: "inventory.export" },
  { href: "/admin/seguridad", label: "Seguridad", icon: ShieldCheck, permission: "admin.access" },
];

// Navegacion principal del panel administrativo.
export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const visibleLinks = adminLinks.filter((item) => hasAdminPermission(role, item.permission));
  const activeHref =
    [...visibleLinks]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) =>
        item.href === "/admin"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      )?.href ?? "/admin";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <Brand compact />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Abrir menú admin">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col overflow-y-auto bg-dark-blue text-white">
            <SheetHeader>
              <SheetTitle className="text-white">Panel administrador</SheetTitle>
            </SheetHeader>
            <SidebarContent activeHref={activeHref} role={role} mobile />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-dark-blue p-5 text-white lg:block">
        <SidebarContent activeHref={activeHref} role={role} />
      </aside>
    </>
  );
}

// Comparte el contenido entre sidebar de escritorio y menu movil.
function SidebarContent({
  activeHref,
  role,
  mobile = false,
}: {
  activeHref: string;
  role: AdminRole;
  mobile?: boolean;
}) {
  const visibleLinks = adminLinks.filter((item) => hasAdminPermission(role, item.permission));

  return (
    <div className={cn("flex h-full flex-col", mobile ? "mt-8" : "")}>
      {!mobile ? <Brand /> : null}

      <nav className={cn("grid gap-1", mobile ? "" : "mt-8")} aria-label="Administrador">
        {visibleLinks.map((item) => {
          const isActive = activeHref === item.href;

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                "justify-start text-white hover:bg-white/10 hover:text-white",
                isActive && "bg-gold text-dark-blue shadow-sm hover:bg-gold hover:text-dark-blue",
              )}
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <item.icon aria-hidden="true" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <Button asChild variant="premium" className="w-full">
          <Link href="/">
            <Home aria-hidden="true" />
            Volver a la tienda
          </Link>
        </Button>
        <form action={logout}>
          <Button type="submit" variant="secondary" className="w-full">
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}

// Muestra la marca del panel en modo normal o compacto.
function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-3">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden",
          compact ? "size-11" : "size-24",
        )}
      >
        <Image
          src="/images/logos/logo-negro-nuevo2.webp"
          alt="Pesca Con Fe"
          fill
          sizes={compact ? "44px" : "96px"}
          className="object-contain"
          priority
        />
      </span>
      <span>
        <span
          className={cn(
            "block font-bold",
            compact ? "text-dark-blue" : "text-lg text-white",
          )}
        >
          Pesca Con Fe
        </span>
        <span className={cn("block text-xs", compact ? "text-muted-foreground" : "text-white/60")}>
          Panel administrador
        </span>
      </span>
    </Link>
  );
}
