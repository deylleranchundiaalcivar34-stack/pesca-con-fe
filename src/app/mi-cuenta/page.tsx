import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, MapPin, PackageSearch, UserRound } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { PublicShell } from "@/components/layout/public-shell";
import { AddressBook } from "@/components/profile/address-book";
import { ProfileForm } from "@/components/profile/profile-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DELIVERY_TYPE_LABELS } from "@/lib/constants";
import { getCustomerOrders } from "@/lib/supabase/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  getCustomerAddresses,
  getCustomerProfile,
  getPublicUserSummary,
} from "@/lib/user";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { PublicUserSummary } from "@/types/user";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Gestiona tu perfil y tus pedidos en Pesca Con Fe.",
};

type AccountSearchParams = {
  seccion?: string | string[];
};

const accountLinks = [
  { href: "/mi-cuenta?seccion=perfil", label: "Mi perfil", icon: UserRound, key: "perfil" },
  {
    href: "/mi-cuenta?seccion=pedidos",
    label: "Mis pedidos",
    icon: PackageSearch,
    key: "pedidos",
  },
  {
    href: "/mi-cuenta?seccion=direcciones",
    label: "Direcciones",
    icon: MapPin,
    key: "direcciones",
  },
];

function getInitials(user: PublicUserSummary) {
  const source = user.fullName ?? user.email ?? "Usuario";
  const parts = source.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getSection(searchParams: AccountSearchParams) {
  const value = Array.isArray(searchParams.seccion)
    ? searchParams.seccion[0]
    : searchParams.seccion;

  if (value === "perfil" || value === "direcciones") {
    return value;
  }

  return "pedidos";
}

async function getAccountUser() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCustomerProfile(supabase, user.id);

  return getPublicUserSummary(user, profile);
}

function Sidebar({
  activeSection,
  user,
}: {
  activeSection: string;
  user: PublicUserSummary;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-dark-blue">
          {getInitials(user)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-dark-blue">
            {user.fullName ?? user.email ?? "Mi cuenta"}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="my-8 h-px bg-border" />

      <nav className="grid gap-2" aria-label="Mi cuenta">
        {accountLinks.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-dark-blue text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-dark-blue",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="my-8 h-px bg-border" />

      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
        >
          <LogOut aria-hidden="true" />
          Cerrar sesion
        </Button>
      </form>
    </aside>
  );
}

function EmptyOrders() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <PackageSearch className="mx-auto size-12 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-black text-dark-blue">No tienes pedidos</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Cuando hagas una compra, podras revisar aqui el estado de tu pedido.
        </p>
        <Button asChild className="mt-6">
          <Link href="/productos">Ver productos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function OrdersList({
  orders,
}: {
  orders: Awaited<ReturnType<typeof getCustomerOrders>>;
}) {
  if (!orders.length) {
    return <EmptyOrders />;
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold text-dark-blue">{order.code}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 grid gap-2">
              {order.items.map((item) => (
                <div
                  key={`${order.id}-${item.productId}`}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.productName} x{item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">
                {DELIVERY_TYPE_LABELS[order.deliveryType]}
              </span>
              <span className="text-lg font-black text-dark-blue">
                {formatCurrency(order.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<AccountSearchParams>;
}) {
  const [user, params] = await Promise.all([getAccountUser(), searchParams]);
  const activeSection = getSection(params);
  const [orders, addresses] = await Promise.all([
    activeSection === "pedidos" ? getCustomerOrders(user.id) : Promise.resolve([]),
    activeSection === "direcciones"
      ? createClient().then((supabase) => getCustomerAddresses(supabase, user.id))
      : Promise.resolve([]),
  ]);

  return (
    <PublicShell>
      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-dark-blue">Mi cuenta</h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
            <Sidebar activeSection={activeSection} user={user} />

            <section>
              {activeSection === "pedidos" ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-dark-blue">Mis pedidos</h2>
                    <p className="text-muted-foreground">Historial de todos tus pedidos</p>
                  </div>
                  <OrdersList orders={orders} />
                </>
              ) : null}

              {activeSection === "perfil" ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-dark-blue">Mi perfil</h2>
                    <p className="text-muted-foreground">
                      Actualiza los datos que usaremos para agilizar tu checkout.
                    </p>
                  </div>
                  <ProfileForm user={user} />
                </>
              ) : null}

              {activeSection === "direcciones" ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-dark-blue">Direcciones</h2>
                    <p className="text-muted-foreground">
                      Guarda tus direcciones para agilizar el checkout.
                    </p>
                  </div>
                  <AddressBook addresses={addresses} />
                </>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
