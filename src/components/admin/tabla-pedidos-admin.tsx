"use client";

import { Fragment, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Eye, MapPin, PackageCheck, Search, Store, XCircle } from "lucide-react";
import {
  cancelOrder,
  confirmOrderPayment,
  markOrderPickedUp,
  markOrderReadyForPickup,
  markOrderShipped,
} from "@/app/admin/pedidos/acciones";
import type { DeliveryType, Order, OrderStatus, PaymentMethod } from "@/types/pedido";
import { businessConfig } from "@/data/datos-negocio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/insignia-estado";
import { DELIVERY_TYPE_LABELS, ORDER_STATUS_LABELS } from "@/lib/constantes";
import { getEcuadorDateKey } from "@/lib/operacion-admin";
import { formatCurrency, formatDate } from "@/lib/utilidades";

interface AdminOrderTableProps {
  orders: Order[];
  initialExpandedOrderId?: string | null;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = { transferencia: "Transferencia", payphone: "PayPhone" };

// Mesa operativa de pedidos: búsqueda, filtros y ficha completa para preparar cada despacho.
export function AdminOrderTable({ orders, initialExpandedOrderId = null }: AdminOrderTableProps) {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [payment, setPayment] = useState<PaymentMethod | "all">("all");
  const [delivery, setDelivery] = useState<DeliveryType | "all">("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(initialExpandedOrderId);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-EC");
    return orders.filter((order) => {
      const searchable = [order.code, order.customer.fullName, order.customer.phone, order.customer.cedula, order.customer.city].filter(Boolean).join(" ").toLocaleLowerCase("es-EC");
      const orderDate = getEcuadorDateKey(order.createdAt);
      return (status === "all" || order.status === status)
        && (payment === "all" || order.paymentMethod === payment)
        && (delivery === "all" || order.deliveryType === delivery)
        && (!normalizedQuery || searchable.includes(normalizedQuery))
        && (!from || orderDate >= from)
        && (!to || orderDate <= to);
    });
  }, [delivery, from, orders, payment, query, status, to]);

  function resetFilters() {
    setStatus("all"); setPayment("all"); setDelivery("all"); setQuery(""); setFrom(""); setTo(""); setExpandedOrderId(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="grid flex-1 gap-1.5 text-sm font-medium text-dark-blue">
            Buscar pedido o cliente
            <span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Código, nombre, cédula o celular" /></span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-dark-blue">Desde<Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-dark-blue">Hasta<Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <FilterSelect label="Estado" value={status} onChange={(value) => setStatus(value as OrderStatus | "all")} options={[{ value: "all", label: "Todos los estados" }, ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
          <FilterSelect label="Pago" value={payment} onChange={(value) => setPayment(value as PaymentMethod | "all")} options={[{ value: "all", label: "Todos los pagos" }, ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))]} />
          <FilterSelect label="Entrega" value={delivery} onChange={(value) => setDelivery(value as DeliveryType | "all")} options={[{ value: "all", label: "Todas las entregas" }, ...Object.entries(DELIVERY_TYPE_LABELS).map(([value, label]) => ({ value, label }))]} />
          <Button type="button" variant="ghost" className="self-end" onClick={resetFilters}>Limpiar</Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Mostrando <span className="font-semibold text-dark-blue">{filtered.length}</span> de {orders.length} pedidos.</p>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((order) => <OrderMobileCard key={order.id} order={order} expanded={expandedOrderId === order.id} onToggle={() => setExpandedOrderId((id) => id === order.id ? null : order.id)} />)}
        {!filtered.length ? <EmptyOrders /> : null}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-border bg-white shadow-sm md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Entrega</TableHead><TableHead>Pago</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return <Fragment key={order.id}>
                <TableRow data-state={isExpanded ? "selected" : undefined}>
                  <TableCell className="font-semibold text-dark-blue">{order.code}</TableCell>
                  <TableCell><p className="font-medium">{order.customer.fullName}</p><p className="text-xs text-muted-foreground">{order.customer.phone}</p></TableCell>
                  <TableCell>{DELIVERY_TYPE_LABELS[order.deliveryType]}</TableCell>
                  <TableCell><PaymentBadge order={order} /></TableCell>
                  <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => setExpandedOrderId((id) => id === order.id ? null : order.id)} aria-label={`Ver detalle de ${order.code}`} title={`Ver detalle de ${order.code}`}><Eye aria-hidden="true" /></Button><OrderActionButtons order={order} /></div></TableCell>
                </TableRow>
                {isExpanded ? <TableRow className="hover:bg-transparent"><TableCell colSpan={8} className="bg-secondary/45 p-0"><div className="border-t border-primary/20 p-4"><OrderDetail order={order} /></div></TableCell></TableRow> : null}
              </Fragment>;
            })}
            {!filtered.length ? <TableRow><TableCell colSpan={8}><EmptyOrders /></TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="grid gap-1.5 text-sm font-medium text-dark-blue">{label}<Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></label>;
}

function OrderMobileCard({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  return <div className="rounded-lg border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold text-dark-blue">{order.code}</p><p className="mt-1 truncate text-sm font-medium">{order.customer.fullName}</p><p className="text-xs text-muted-foreground">{order.customer.phone}</p></div><StatusBadge status={order.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Fecha" value={formatDate(order.createdAt)} /><Info label="Entrega" value={DELIVERY_TYPE_LABELS[order.deliveryType]} /><Info label="Pago" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} /><Info label="Total" value={formatCurrency(order.total)} strong /></div><div className="mt-4 flex flex-wrap justify-end gap-2"><Button type="button" size="sm" variant="outline" onClick={onToggle}>{expanded ? "Ocultar ficha" : "Ver ficha"}<ChevronDown className={expanded ? "rotate-180" : ""} aria-hidden="true" /></Button><OrderActionButtons order={order} /></div>{expanded ? <OrderDetail order={order} compact /> : null}</div>;
}

function OrderActionButtons({ order }: { order: Order }) {
  const canCancel = ["pendiente_pago", "pagado_confirmado", "listo_retiro"].includes(order.status);
  return <>
    {order.paymentMethod === "transferencia" ? <form action={confirmOrderPayment}><input type="hidden" name="id" value={order.id} /><Button size="icon" variant="ghost" disabled={order.status !== "pendiente_pago"} aria-label={`Confirmar pago de ${order.code}`} title="Confirmar pago"><CheckCircle2 aria-hidden="true" /></Button></form> : null}
    {order.deliveryType === "retiro_local" ? <form action={markOrderReadyForPickup}><input type="hidden" name="id" value={order.id} /><Button size="icon" variant="ghost" disabled={order.status !== "pagado_confirmado"} aria-label={`Marcar listo para retiro ${order.code}`} title="Listo para retiro"><Store aria-hidden="true" /></Button></form> : <form action={markOrderShipped}><input type="hidden" name="id" value={order.id} /><Button size="icon" variant="ghost" disabled={order.status !== "pagado_confirmado"} aria-label={`Marcar enviado ${order.code}`} title="Marcar enviado"><PackageCheck aria-hidden="true" /></Button></form>}
    <form action={markOrderPickedUp}><input type="hidden" name="id" value={order.id} /><Button size="icon" variant="ghost" disabled={order.status !== "listo_retiro"} aria-label={`Marcar retirado ${order.code}`} title="Marcar retirado"><PackageCheck aria-hidden="true" /></Button></form>
    <form action={cancelOrder}><input type="hidden" name="id" value={order.id} /><Button size="icon" variant="ghost" disabled={!canCancel} aria-label={`Cancelar pedido ${order.code}`} title="Cancelar pedido"><XCircle aria-hidden="true" /></Button></form>
  </>;
}

// Ficha imprimible visualmente con toda la información necesaria para cobro y despacho.
function OrderDetail({ order, compact = false }: { order: Order; compact?: boolean }) {
  const isPickup = order.deliveryType === "retiro_local";
  return <div className={compact ? "mt-4 rounded-lg border border-border bg-secondary/40 p-3" : "rounded-lg border border-border bg-white p-4 shadow-sm"}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-bold text-dark-blue">Ficha del pedido {order.code}</p><p className="text-sm text-muted-foreground">Creado el {formatDate(order.createdAt)}{order.paidAt ? ` · Pago registrado el ${formatDate(order.paidAt)}` : ""}</p></div><div className="flex flex-wrap gap-2"><PaymentBadge order={order} /><StatusBadge status={order.status} /></div></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-3">
      <DetailSection title="Datos del cliente"><DetailLine label="Nombre" value={order.customer.fullName} /><DetailLine label="Cédula" value={order.customer.cedula} empty="No registrada" /><DetailLine label="Celular" value={order.customer.phone} /><DetailLine label="Correo" value={order.customer.email} empty="No registrado" /></DetailSection>
      <DetailSection title={isPickup ? "Retiro local" : "Datos para el envío"}><DetailLine label="Modalidad" value={DELIVERY_TYPE_LABELS[order.deliveryType]} />{isPickup ? <><DetailLine label="Punto de retiro" value={`${businessConfig.location}, ${businessConfig.city}`} /><p className="mt-2 rounded-md bg-secondary p-2 text-xs text-muted-foreground">El cliente retira el pedido en el local. No requiere dirección de envío.</p></> : <><DetailLine label="Provincia" value={order.customer.province} /><DetailLine label="Ciudad" value={order.customer.city} /><DetailLine label="Dirección" value={order.customer.address} empty="Se enviará a oficina de Servientrega en la ciudad seleccionada" /><DetailLine label="Referencia" value={order.customer.deliveryReference} empty="Sin referencia adicional" /></>}</DetailSection>
      <DetailSection title="Cobro y total"><DetailLine label="Método" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} /><DetailLine label="Estado de pago" value={paymentStatusLabel(order.paymentStatus)} /><DetailLine label="Subtotal" value={formatCurrency(order.subtotal)} />{order.discount > 0 ? <DetailLine label="Bienvenida 10%" value={`-${formatCurrency(order.discount)}`} /> : null}<DetailLine label="Envío" value={formatCurrency(order.shipping)} />{order.paymentFee > 0 ? <DetailLine label="Recargo de pago" value={formatCurrency(order.paymentFee)} /> : null}<div className="mt-3 flex justify-between border-t border-border pt-3 font-bold text-dark-blue"><span>Total</span><span>{formatCurrency(order.total)}</span></div></DetailSection>
    </div>
    <div className="mt-4"><p className="mb-2 font-semibold text-dark-blue">Productos</p><div className="grid gap-2 lg:grid-cols-2">{order.items.map((item, index) => <div key={`${item.productId}-${item.variantId ?? "base"}-${index}`} className="flex items-start justify-between gap-3 rounded-md border border-border bg-white p-3 text-sm"><div><p className="font-medium">{item.productName}{item.variantName ? ` · ${item.variantName}` : ""}</p><p className="text-muted-foreground">Cantidad: {item.quantity}</p></div><span className="shrink-0 font-semibold">{formatCurrency(item.price * item.quantity)}</span></div>)}</div></div>
  </div>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-lg border border-border bg-secondary/35 p-3"><h3 className="mb-2 flex items-center gap-2 font-semibold text-dark-blue"><MapPin className="size-4 text-primary" aria-hidden="true" />{title}</h3>{children}</section>; }
function DetailLine({ label, value, empty = "No disponible" }: { label: string; value?: string; empty?: string }) { return <div className="flex justify-between gap-3 py-1.5 text-sm"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] text-right font-medium">{value || empty}</span></div>; }
function PaymentBadge({ order }: { order: Order }) { return <Badge variant={order.paymentMethod === "payphone" ? "premium" : "outline"}>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Badge>; }
function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className={strong ? "font-bold text-dark-blue" : "font-medium"}>{value}</p></div>; }
function EmptyOrders() { return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay pedidos que coincidan con los filtros.</div>; }
function paymentStatusLabel(status: Order["paymentStatus"]) { return ({ pendiente: "Pendiente", preparando: "Preparando cobro", preparado: "Cobro preparado", aprobado: "Aprobado", cancelado: "Cancelado", fallido: "Fallido", expirado: "Expirado", requiere_revision: "Requiere revisión" })[status]; }
