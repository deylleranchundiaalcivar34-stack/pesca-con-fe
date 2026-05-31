"use client";

import Link from "next/link";
import { LogOut, Menu, Store } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú admin">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Panel Pesca Con Fe</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 grid gap-2">
                {links.map((link) => (
                  <Button key={link.href} asChild variant="ghost" className="justify-start">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <Button asChild variant="outline" className="mt-4 justify-start">
                  <Link href="/">Ver tienda</Link>
                </Button>
                <form action={logout}>
                  <Button type="submit" variant="secondary" className="w-full justify-start">
                    <LogOut aria-hidden="true" />
                    Cerrar sesión
                  </Button>
                </form>
              </nav>
            </SheetContent>
          </Sheet>
          <div>
            <p className="text-sm font-semibold text-dark-blue">Panel administrador</p>
            <p className="text-xs text-muted-foreground">
              Acceso administrativo.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <Store aria-hidden="true" />
              Tienda
            </Link>
          </Button>
          <form action={logout}>
            <Button variant="secondary" size="sm" type="submit">
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
