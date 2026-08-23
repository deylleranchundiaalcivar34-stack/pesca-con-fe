"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import {
  BadgePercent,
  CalendarClock,
  ChevronRight,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import type { Order } from "@/types/pedido";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/insignia-estado";
import {
  getWelcomePromotionDaysRemaining,
  getWelcomePromotionPhase,
  WELCOME_PROMOTION,
} from "@/lib/promocion-bienvenida";
import { formatCurrency, formatDate } from "@/lib/utilidades";

function isConfirmedPurchase(order: Order) {
  return order.paymentStatus === "aprobado" ||
    ["pagado_confirmado", "listo_retiro", "retirado", "enviado"].includes(order.status);
}

export function AdminWelcomePromotionCard({
  orders,
  nowIso,
}: {
  orders: Order[];
  nowIso: string;
}) {
  const now = new Date(nowIso);
  const phase = getWelcomePromotionPhase(now);
  const daysRemaining = getWelcomePromotionDaysRemaining(now);
  const confirmedOrders = orders.filter(isConfirmedPurchase);
  const activePromotions = phase === "activa" ? 1 : 0;
  const phaseLabel = phase === "activa" ? "Activa" : phase === "programada" ? "Programada" : "Finalizada";

  return (
    <DialogPrimitive.Root>
      <Card className="overflow-hidden border-gold/50 bg-[linear-gradient(110deg,rgb(255_255_255),rgb(236_197_80_/_0.11))]">
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="group flex w-full flex-col gap-4 p-4 text-left transition hover:bg-gold/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:p-5"
            aria-label="Ver actividad de la promoción de bienvenida"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-dark-blue">
                <BadgePercent className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-base text-dark-blue">Descuentos activos</strong>
                  <Badge variant={activePromotions ? "success" : "muted"}>{activePromotions}</Badge>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Bienvenida 10% · {confirmedOrders.length} cliente(s) con compra confirmada
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm">
                <span className="block font-semibold text-dark-blue">
                  {phase === "activa" ? `${daysRemaining} día(s) restantes` : phaseLabel}
                </span>
                <span className="block text-xs text-muted-foreground">Ver actividad</span>
              </span>
              <ChevronRight className="size-5 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </button>
        </DialogPrimitive.Trigger>
      </Card>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-dark-blue/50 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-100 data-[state=open]:duration-150 motion-reduce:animate-none" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90svh] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gold/35 bg-white shadow-[0_18px_55px_rgb(5_44_101_/_0.22)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-100 data-[state=open]:duration-150 motion-reduce:animate-none">
          <div className="border-b border-border bg-[linear-gradient(110deg,rgb(5_44_101),rgb(7_54_111))] p-5 pr-14 text-white sm:p-6 sm:pr-16">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={phase === "activa" ? "success" : phase === "programada" ? "warning" : "muted"}>{phaseLabel}</Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Beneficio de bienvenida</span>
            </div>
            <DialogPrimitive.Title className="mt-3 text-2xl font-black">
              Descuento del 10% en la primera compra
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-white/75">
              Información operativa de la promoción y pedidos donde fue aplicada.
            </DialogPrimitive.Description>
          </div>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Cerrar actividad de la promoción"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Summary icon={CalendarClock} label="Vigencia" value={WELCOME_PROMOTION.validityLabel} />
              <Summary icon={Users} label="Compras confirmadas" value={String(confirmedOrders.length)} />
              <Summary
                icon={ShoppingBag}
                label="Pedidos relacionados"
                value={String(orders.length)}
              />
            </div>

            <div className="rounded-lg border border-gold/45 bg-gold/10 p-4 text-sm leading-6 text-dark-blue">
              <strong>Condiciones:</strong> compra mínima de {formatCurrency(WELCOME_PROMOTION.minimumSubtotal)}, descuento máximo de {formatCurrency(WELCOME_PROMOTION.maximumDiscount)}, una vez por cliente y sin combinar con otras promociones. No incluye envío ni recargos de pago.
            </div>

            <section aria-labelledby="promotion-orders-title">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 id="promotion-orders-title" className="font-bold text-dark-blue">Clientes y pedidos relacionados</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Selecciona un pedido para abrir directamente su ficha completa.</p>
                </div>
                {phase === "activa" ? <Badge variant="premium">Faltan {daysRemaining} día(s)</Badge> : null}
              </div>

              {orders.length ? (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                  {orders.map((order) => (
                    <DialogPrimitive.Close asChild key={order.id}>
                      <Link
                        href={{ pathname: "/admin/pedidos", query: { pedido: order.id } }}
                        className="group flex flex-col gap-2 rounded-lg border border-border bg-secondary/40 p-3 transition hover:border-primary/35 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                        aria-label={`Abrir la ficha del pedido ${order.code} de ${order.customer.fullName}`}
                      >
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-dark-blue">{order.customer.fullName}</strong>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{order.code} · {formatDate(order.createdAt)}</span>
                        </span>
                        <span className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-right">
                            <span className="block text-xs text-muted-foreground">Descuento</span>
                            <strong className="text-sm text-emerald-700">-{formatCurrency(order.discount)}</strong>
                          </span>
                          <StatusBadge status={order.status} />
                          <ChevronRight className="size-4 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </Link>
                    </DialogPrimitive.Close>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Todavía no hay pedidos relacionados con este descuento.
                </p>
              )}
            </section>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/35 p-3">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-dark-blue">{value}</p>
    </div>
  );
}
