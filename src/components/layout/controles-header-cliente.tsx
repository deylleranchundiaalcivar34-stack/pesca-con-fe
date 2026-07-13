"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
  ShoppingCart,
  Search,
  UserRound,
} from "lucide-react";
import { logout } from "@/app/auth/acciones";
import { CartDrawer } from "@/components/cart/panel-carrito";
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
import { useIsClient } from "@/hooks/use-es-cliente";
import {
  notifyPublicSessionChange,
  publicSessionEventName,
} from "@/lib/sesion-publica";
import { useCartStore } from "@/store/tienda-carrito";
import type { PublicUserSummary } from "@/types/usuario";
import { navItems } from "./items-navegacion";
import { MobileFixedNavigation } from "./mega-menu-catalogo";

type SessionResponse = {
  user: PublicUserSummary | null;
};

let sessionPromise: Promise<PublicUserSummary | null> | null = null;

function loadPublicUser() {
  sessionPromise ??= fetch("/api/sesion", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then((response) => (response.ok ? response.json() : { user: null }))
    .then((data: SessionResponse) => data.user)
    .catch(() => null)
    .finally(() => {
      sessionPromise = null;
    });

  return sessionPromise;
}

// Lee la sesion sin convertir todo el shell publico en render dinamico.
function usePublicUser() {
  const pathname = usePathname();
  const syncVersion = useRef(0);
  const [user, setUser] = useState<PublicUserSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncUser() {
      const requestVersion = syncVersion.current + 1;
      syncVersion.current = requestVersion;
      const nextUser = await loadPublicUser();
      if (isMounted && requestVersion === syncVersion.current) {
        setUser(nextUser);
      }
    }

    function handleSessionEvent(event: Event) {
      const nextUser = (event as CustomEvent<{ user?: PublicUserSummary | null }>).detail
        ?.user;

      if (nextUser !== undefined) {
        syncVersion.current += 1;
        setUser(nextUser);
        return;
      }

      void syncUser();
    }

    void syncUser();
    window.addEventListener("focus", syncUser);
    window.addEventListener(publicSessionEventName, handleSessionEvent);
    document.addEventListener("visibilitychange", syncUser);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncUser);
      window.removeEventListener(publicSessionEventName, handleSessionEvent);
      document.removeEventListener("visibilitychange", syncUser);
    };
  }, [pathname]);

  return { user, setUser };
}

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
function UserMenu({
  user,
  onOptimisticLogout,
}: {
  user: PublicUserSummary;
  onOptimisticLogout: () => void;
}) {
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
            onOptimisticLogout();
            notifyPublicSessionChange(null);
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
    <Button
      asChild
      variant="outline"
      size={mobile ? "default" : "sm"}
      className={mobile ? "justify-start" : ""}
    >
      <Link href="/login">
        <UserRound aria-hidden="true" />
        Iniciar sesión
      </Link>
    </Button>
  );
}

export function HeaderUserControls({ mobile = false }: { mobile?: boolean }) {
  const { user, setUser } = usePublicUser();
  return user ? (
    <UserMenu user={user} onOptimisticLogout={() => setUser(null)} />
  ) : (
    <LoginLink mobile={mobile} />
  );
}

export function HeaderCartButton() {
  const isClient = useIsClient();
  const itemCount = useCartStore((state) => state.itemCount());

  return (
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
  );
}

export function HeaderSearch() {
  return (
    <form action="/productos" method="get" className="relative hidden min-w-44 flex-1 xl:block">
      <label htmlFor="header-search" className="sr-only">Buscar productos</label>
      <input id="header-search" name="busqueda" type="search" placeholder="Buscar productos..." className="h-10 w-full rounded-full border border-border bg-secondary/40 pl-4 pr-10 text-sm text-dark-blue outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" />
      <button type="submit" className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full text-dark-blue transition hover:bg-primary hover:text-white" aria-label="Buscar productos"><Search className="size-4" aria-hidden="true" /></button>
    </form>
  );
}

export function HeaderWishlistButton() {
  return <Button asChild variant="dark" size="icon" className="group" aria-label="Lista de deseos">
    <Link href="/lista-deseos"><Heart className="transition group-hover:fill-white" aria-hidden="true" /></Link>
  </Button>;
}

export function MobileMenu() {
  const { user, setUser } = usePublicUser();

  return (
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
            <Button key={item.href} asChild variant="ghost" className="justify-start"><Link href={item.href}>{item.label}</Link></Button>
          ))}
          <form action="/productos" method="get" className="relative my-2">
            <input name="busqueda" type="search" placeholder="Buscar productos..." className="h-10 w-full rounded-md border border-border pl-3 pr-10 text-sm" />
            <button type="submit" className="absolute right-1 top-1 flex size-8 items-center justify-center" aria-label="Buscar productos"><Search className="size-4" aria-hidden="true" /></button>
          </form>
          <MobileFixedNavigation />
          <Button asChild variant="outline" className="justify-start"><Link href="/lista-deseos"><Heart aria-hidden="true" />Lista de deseos</Link></Button>
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
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setUser(null);
                    notifyPublicSessionChange(null);
                  }}
                >
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
  );
}
