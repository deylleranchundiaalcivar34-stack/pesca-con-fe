"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Home,
  LogOut,
  Menu,
  PackagePlus,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/productos", label: "Productos", icon: Boxes },
  { href: "/admin/productos/nuevo", label: "Crear producto", icon: PackagePlus },
  { href: "/admin/ventas", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const activeHref =
    [...adminLinks]
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
            <SidebarContent activeHref={activeHref} mobile />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-dark-blue p-5 text-white lg:block">
        <SidebarContent activeHref={activeHref} />
      </aside>
    </>
  );
}

function SidebarContent({
  activeHref,
  mobile = false,
}: {
  activeHref: string;
  mobile?: boolean;
}) {
  return (
    <div className={cn("flex h-full flex-col", mobile ? "mt-8" : "")}>
      {!mobile ? <Brand /> : null}

      <nav className={cn("grid gap-1", mobile ? "" : "mt-8")} aria-label="Administrador">
        {adminLinks.map((item) => {
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

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-3">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden",
          compact ? "size-11" : "size-14",
        )}
      >
        <Image
          src="/images/logos/logo-negro.webp"
          alt="Pesca Con Fe"
          fill
          sizes={compact ? "44px" : "56px"}
          className="object-contain"
          priority
        />
      </span>
      <span>
        <span className={cn("block font-bold", compact ? "text-dark-blue" : "text-white")}>
          Pesca Con Fe
        </span>
        <span className={cn("block text-xs", compact ? "text-muted-foreground" : "text-white/60")}>
          Panel administrador
        </span>
      </span>
    </Link>
  );
}
