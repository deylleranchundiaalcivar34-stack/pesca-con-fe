"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CreditCard, DollarSign, ReceiptText, TrendingUp } from "lucide-react";
import type { Order } from "@/types/pedido";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utilidades";

type Period = "today" | "week" | "month" | "year" | "custom";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
  { value: "custom", label: "Rango" },
];

function localDateKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function isCollected(order: Order) {
  return ["pagado_confirmado", "listo_retiro", "retirado", "enviado"].includes(order.status);
}

function rangeFor(period: Period, start: string, end: string) {
  const today = new Date();
  const todayKey = localDateKey(today);
  const startDate = new Date(today);

  if (period === "week") startDate.setDate(today.getDate() - 6);
  if (period === "month") startDate.setDate(today.getDate() - 29);
  if (period === "year") startDate.setFullYear(today.getFullYear() - 1);

  return {
    start: period === "custom" ? start : period === "today" ? todayKey : localDateKey(startDate),
    end: period === "custom" ? end : todayKey,
  };
}

// Analítica de ventas basada únicamente en pedidos ya cobrados.
export function AdminSalesSummary({ orders }: { orders: Order[] }) {
  const [period, setPeriod] = useState<Period>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const range = rangeFor(period, customStart, customEnd);

  const inRangeOrders = useMemo(
    () =>
      orders.filter((order) => {
        const key = localDateKey(order.createdAt);
        return (!range.start || key >= range.start) && (!range.end || key <= range.end);
      }),
    [orders, range.end, range.start],
  );
  const collected = inRangeOrders.filter(isCollected);
  const total = collected.reduce((sum, order) => sum + order.total, 0);
  const average = collected.length ? total / collected.length : 0;
  const pending = inRangeOrders.filter((order) => order.status === "pendiente_pago");
  const payphoneTotal = collected
    .filter((order) => order.paymentMethod === "payphone")
    .reduce((sum, order) => sum + order.total, 0);
  const transferTotal = total - payphoneTotal;

  const dailyRows = (() => {
    const byDay = new Map<string, { total: number; orders: number }>();
    for (const order of collected) {
      const key = localDateKey(order.createdAt);
      const current = byDay.get(key) ?? { total: 0, orders: 0 };
      current.total += order.total;
      current.orders += 1;
      byDay.set(key, current);
    }

    return [...byDay.entries()]
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => b.date.localeCompare(a.date));
  })();
  const maxDaily = Math.max(...dailyRows.map((row) => row.total), 1);

  return (
    <section className="space-y-4" aria-label="Resumen de ventas">
      <Card className="overflow-hidden border-primary/15">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-dark-blue">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
                <TrendingUp className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold">Control de ventas</p>
                <p className="text-sm text-muted-foreground">Solo cuenta pedidos ya cobrados.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={period === item.value ? "default" : "outline"}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
        {period === "custom" ? (
          <CardContent className="grid gap-3 border-t border-border bg-secondary/45 p-4 sm:grid-cols-2 sm:p-5">
            <label className="grid gap-1.5 text-sm font-medium text-dark-blue">
              Desde
              <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-dark-blue">
              Hasta
              <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </label>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={DollarSign} title="Ventas cobradas" value={formatCurrency(total)} helper={`${collected.length} pedido(s) cobrados`} />
        <Metric icon={ReceiptText} title="Ticket promedio" value={formatCurrency(average)} helper="Promedio por pedido cobrado" />
        <Metric icon={CalendarDays} title="Pendientes" value={String(pending.length)} helper="Esperan confirmación de pago" />
        <Metric icon={CreditCard} title="PayPhone" value={formatCurrency(payphoneTotal)} helper={`Transferencia: ${formatCurrency(transferTotal)}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Registro diario de ventas</CardTitle>
            <p className="text-sm text-muted-foreground">Monto bruto cobrado por día, antes de comisiones de la pasarela.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyRows.length ? dailyRows.map((row) => (
              <div key={row.date} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-dark-blue">{new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Guayaquil" }).format(new Date(`${row.date}T12:00:00`))}</span>
                  <span className="font-semibold">{formatCurrency(row.total)} <span className="font-normal text-muted-foreground">· {row.orders} ped.</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max((row.total / maxDaily) * 100, 4)}%` }} />
                </div>
              </div>
            )) : <EmptyState />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle>Lectura rápida</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryLine label="Pedidos en el periodo" value={String(inRangeOrders.length)} />
            <SummaryLine label="Cobrados" value={String(collected.length)} success />
            <SummaryLine label="Pendientes de pago" value={String(pending.length)} />
            <div className="rounded-lg border border-primary/15 bg-secondary/60 p-3 text-muted-foreground">
              Para preparar un envío, abre <span className="font-semibold text-dark-blue">Pedidos</span>: ahí está la ficha completa con cédula, ciudad, dirección, referencias y productos.
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, title, value, helper }: { icon: typeof DollarSign; title: string; value: string; helper: string }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-black text-dark-blue">{value}</p><p className="mt-2 text-xs text-muted-foreground">{helper}</p></div><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="size-5" aria-hidden="true" /></span></div></Card>;
}

function SummaryLine({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5"><span className="text-muted-foreground">{label}</span><span className={cn("font-bold text-dark-blue", success && "text-emerald-700")}>{value}</span></div>;
}

function EmptyState() {
  return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay ventas cobradas para este periodo.</div>;
}
