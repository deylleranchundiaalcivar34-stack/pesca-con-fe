"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { logout } from "@/app/auth/acciones";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/panel-carrito";
import { useIsClient } from "@/hooks/use-es-cliente";
import { useCartStore } from "@/store/tienda-carrito";
import type { PublicUserSummary } from "@/types/usuario";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/contacto", label: "Contacto" },
];

// Decide el nombre completo que se muestra en menu y saludo.
function getDisplayName(user: PublicUserSummary) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.fullName || user.email || "Mi cuenta";
}

// Acorta el nombre del disparador para que el header no se sature.
function getTriggerName(user: PublicUserSummary) {
  return user.firstName || user.fullName || user.email || "Mi cuenta";
}

// Menu del usuario autenticado con accesos de cuenta, admin y logout.
function UserMenu({ user }: { user: PublicUserSummary }) {
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const displayName = getDisplayName(user);
  const triggerName = getTriggerName(user);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex max-w-48 items-center gap-2 rounded-md px-2 py-2 text-sm font-bold text-dark-blue transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserRound aria-hidden="true" />
          <span className="truncate">{triggerName}</span>
          <ChevronDown
            className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className="z-[60] max-h-[min(28rem,calc(100vh-5rem))] min-w-56 overflow-y-auto p-0"
      >
        <DropdownMenuLabel className="px-4 py-3">
          <span className="block max-w-48 truncate font-bold text-dark-blue">
            {displayName}
          </span>
          <span className="block max-w-48 truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="mx-1 my-1 px-3 text-muted-foreground">
          <Link href="/mi-cuenta?seccion=perfil">
            <UserRound aria-hidden="true" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="mx-1 my-1 px-3 text-muted-foreground">
          <Link href="/mi-cuenta?seccion=pedidos">
            <PackageSearch aria-hidden="true" />
            Mis pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="mx-1 my-1 px-3 text-muted-foreground">
          <Link href="/mi-cuenta?seccion=direcciones">
            <MapPin aria-hidden="true" />
            Direcciones
          </Link>
        </DropdownMenuItem>
        {user.isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="mx-1 my-1 px-3 text-muted-foreground">
              <Link href="/admin">
                <LayoutDashboard aria-hidden="true" />
                Panel Administrador
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        
          <DropdownMenuItem
            disabled={isLoggingOut}
            onSelect={(event) => {
              event.preventDefault();
              startLogoutTransition(() => {
                void logout();
              });
            }}
            className="m-1 bg-secondary/70 px-3 font-semibold text-destructive focus:bg-secondary focus:text-destructive"
          >
            
              <LogOut aria-hidden="true" />
              Cerrar sesión
            
          </DropdownMenuItem>
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Enlace de login con variante para desktop o movil.
function LoginLink({ mobile = false }: { mobile?: boolean }) {
  return (
    <Button asChild variant="outline" size={mobile ? "default" : "sm"} className={mobile ? "justify-start" : ""}>
      <Link href="/login">
        <UserRound aria-hidden="true" />
        Iniciar sesión
      </Link>
    </Button>
  );
}

// Header publico con navegacion, sesion y carrito.
export function Header({ user }: { user: PublicUserSummary | null }) {
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
          {user ? <UserMenu user={user} /> : <LoginLink />}
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
                {user ? (
                  <>
                    <Button asChild variant="outline" className="mt-4 justify-start">
                      <Link href="/mi-cuenta?seccion=perfil">
                        <UserRound aria-hidden="true" />
                        Mi perfil
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/mi-cuenta?seccion=pedidos">
                        <PackageSearch aria-hidden="true" />
                        Mis pedidos
                      </Link>
                    </Button>
                    {user.isAdmin ? (
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/admin">
                          <LayoutDashboard aria-hidden="true" />
                          Panel Administrador
                        </Link>
                      </Button>
                    ) : null}
                    <form action={logout}>
                      <Button type="submit" variant="ghost" className="w-full justify-start">
                        <LogOut aria-hidden="true" />
                        Cerrar sesión
                      </Button>
                    </form>
                  </>
                ) : (
                  <LoginLink mobile />
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
