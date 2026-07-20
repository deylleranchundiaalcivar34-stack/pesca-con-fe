"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
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
  getPublicSessionServerSnapshot,
  getPublicSessionSnapshot,
  notifyPublicSessionChange,
  refreshPublicSession,
  setPublicSessionUser,
  subscribePublicSession,
} from "@/lib/sesion-publica";
import { useCartStore } from "@/store/tienda-carrito";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";
import { cn, formatCurrency } from "@/lib/utilidades";
import type { PublicUserSummary } from "@/types/usuario";
import { navItems } from "./items-navegacion";
import { MobileFixedNavigation } from "./mega-menu-catalogo";

type ProductSearchSuggestion = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  image: string;
  imageAlt: string;
  price: number;
};

// Lee la sesion sin convertir todo el shell publico en render dinamico.
function usePublicUser() {
  const pathname = usePathname();
  const session = useSyncExternalStore(
    subscribePublicSession,
    getPublicSessionSnapshot,
    getPublicSessionServerSnapshot,
  );

  useEffect(() => {
    void refreshPublicSession();
  }, [pathname]);

  useEffect(() => {
    function syncUser() {
      void refreshPublicSession({ force: true });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") syncUser();
    }

    window.addEventListener("focus", syncUser);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncUser);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { ...session, setUser: setPublicSessionUser };
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

// Reserva el espacio de la cuenta sin afirmar que el visitante cerro sesion.
function AccountLoading({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Comprobando sesión"
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-border/70 px-3 text-muted-foreground",
        mobile ? "w-full justify-start" : "w-28",
      )}
    >
      <UserRound className="size-4" aria-hidden="true" />
      <span className="h-2.5 flex-1 animate-pulse rounded-full bg-border" aria-hidden="true" />
    </div>
  );
}

export function HeaderUserControls({ mobile = false }: { mobile?: boolean }) {
  const { status, user, setUser } = usePublicUser();

  if (status === "loading") return <AccountLoading mobile={mobile} />;

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: ProductSearchSuggestion[] };

        if (response.ok) setResults(data.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <form
      action="/productos"
      method="get"
      className="relative hidden min-w-44 flex-1 xl:block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <label htmlFor="header-search" className="sr-only">Buscar productos</label>
      <input
        id="header-search"
        name="busqueda"
        type="search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setResults([]);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar productos..."
        className="h-10 w-full rounded-full border border-border bg-secondary/40 pl-4 pr-10 text-sm text-dark-blue outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
      />
      <button type="submit" className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full text-dark-blue transition hover:bg-primary hover:text-white" aria-label="Buscar productos"><Search className="size-4" aria-hidden="true" /></button>
      {isOpen && query.trim().length >= 2 && results.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-border bg-white shadow-xl">
          <div className="max-h-[min(30rem,calc(100vh-5rem))] divide-y divide-border overflow-y-auto">
            {results.map((product) => (
              <Link
                key={product.slug}
                href={`/producto/${product.slug}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-dark-blue">{product.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{product.brand} · {product.category}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-dark-blue">{formatCurrency(product.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}

export function HeaderWishlistButton() {
  const wishlistCount = useWishlistStore((state) => state.productIds.length);
  const wishlistHydrated = useWishlistHydrated();

  return (
    <Button asChild variant="dark" size="icon" className="group relative" aria-label="Lista de deseos">
      <Link href="/lista-deseos">
        <Heart className="transition group-hover:fill-white" aria-hidden="true" />
        {wishlistHydrated && wishlistCount ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {wishlistCount > 9 ? "9+" : wishlistCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

function MobileAccountNavigation({ user }: { user: PublicUserSummary }) {
  return (
    <details className="group rounded-lg border border-border bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-3 font-bold text-dark-blue transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <UserRound className="size-4" aria-hidden="true" />
          Mi perfil
        </span>
        <ChevronDown className="size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-1 grid gap-1 border-t border-border p-2">
        <Button asChild variant="ghost" className="justify-start">
          <Link href="/mi-cuenta?seccion=perfil">
            <UserRound aria-hidden="true" />
            Ver perfil
          </Link>
        </Button>
        <Button asChild variant="ghost" className="justify-start">
          <Link href="/mi-cuenta?seccion=pedidos">
            <PackageSearch aria-hidden="true" />
            Mis pedidos
          </Link>
        </Button>
        <Button asChild variant="ghost" className="justify-start">
          <Link href="/mi-cuenta?seccion=direcciones">
            <MapPin aria-hidden="true" />
            Direcciones
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
      </div>
    </details>
  );
}

export function MobileMenu() {
  const { status, user, setUser } = usePublicUser();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menú">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex h-[100dvh] flex-col overflow-hidden p-0">
        <SheetHeader className="shrink-0 px-6 pb-0 pt-6 pr-14">
          <SheetTitle>Pesca Con Fe</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-6 pb-8 pr-4 touch-pan-y" aria-label="Menú móvil">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" className="justify-start"><Link href={item.href}>{item.label}</Link></Button>
          ))}
          <form action="/productos" method="get" className="relative my-2">
            <input name="busqueda" type="search" placeholder="Buscar productos..." className="h-10 w-full rounded-md border border-border pl-3 pr-10 text-sm" />
            <button type="submit" className="absolute right-1 top-1 flex size-8 items-center justify-center" aria-label="Buscar productos"><Search className="size-4" aria-hidden="true" /></button>
          </form>
          <MobileFixedNavigation />
          <Button asChild variant="outline" className="justify-start"><Link href="/lista-deseos"><Heart aria-hidden="true" />Lista de deseos</Link></Button>
          {status === "loading" ? (
            <AccountLoading mobile />
          ) : user ? (
            <>
              <MobileAccountNavigation user={user} />
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
