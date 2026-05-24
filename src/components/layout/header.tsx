"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useIsClient } from "@/hooks/use-is-client";
import { useCartStore } from "@/store/cart-store";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  const isClient = useIsClient();
  const itemCount = useCartStore((state) => state.itemCount());

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex h-14 w-36 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Inicio - Pesca Con Fe"
        >
          <Image
            src="/images/logos/logo-blanco.webp"
            alt="Pesca Con Fe"
            width={418}
            height={178}
            priority
            className="h-auto max-h-12 w-full object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="outline" size="icon">
            <Link href="/login" aria-label="Acceso administrativo">
              <UserRound aria-hidden="true" />
            </Link>
          </Button>
          <CartDrawer>
            <Button variant="dark" size="icon" className="relative" aria-label="Abrir carrito">
              <ShoppingCart aria-hidden="true" />
              {isClient && itemCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-dark-blue">
                  {itemCount}
                </span>
              ) : null}
            </Button>
          </CartDrawer>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer>
            <Button variant="dark" size="icon" className="relative" aria-label="Abrir carrito">
              <ShoppingCart aria-hidden="true" />
              {isClient && itemCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-dark-blue">
                  {itemCount}
                </span>
              ) : null}
            </Button>
          </CartDrawer>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menú">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Pesca Con Fe</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 grid gap-2" aria-label="Menú móvil">
                {navItems.map((item) => (
                  <Button key={item.href} asChild variant="ghost" className="justify-start">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                <Button asChild variant="outline" className="mt-4 justify-start">
                  <Link href="/login">
                    <UserRound aria-hidden="true" />
                    Ingresar al panel
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
