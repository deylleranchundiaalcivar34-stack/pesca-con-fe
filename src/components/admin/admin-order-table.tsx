"use client";

import { Fragment, useMemo, useState } from "react";
import { CheckCircle2, Eye, PackageCheck, Store, XCircle } from "lucide-react";
import {
  cancelOrder,
  confirmOrderPayment,
  markOrderPickedUp,
  markOrderReadyForPickup,
  markOrderShipped,
} from "@/app/admin/pedidos/actions";
import type { Order, OrderStatus } from "@/types/order";
import { businessConfig } from "@/data/mock-business";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AdminOrderTableProps {
  orders: Order[];
}

export function AdminOrderTable({ orders }: AdminOrderTableProps) {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filtered = useMemo(
    () => orders.filter((order) => status === "all" || order.status === status),
    [orders, status],
  );

  const toggleDetail = (orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-dark-blue">Pedidos</p>
          <p className="text-sm text-muted-foreground">
            Revisa y actualiza el estado de los pedidos.
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as OrderStatus | "all");
            setExpandedOrderId(null);
          }}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const detailLabel = isExpanded
            ? `Ocultar detalle de ${order.code}`
            : `Ver detalle de ${order.code}`;

          return (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-dark-blue">{order.code}</p>
                  <p className="mt-1 truncate text-sm font-medium">
                    {order.customer.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Info label="Fecha" value={formatDate(order.createdAt)} />
                <Info label="Entrega" value={DELIVERY_TYPE_LABELS[order.deliveryType]} />
                <Info label="Total" value={formatCurrency(order.total)} strong />
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleDetail(order.id)}
                  aria-label={detailLabel}
                  title={detailLabel}
                >
                  <Eye aria-hidden="true" />
                </Button>
                <OrderActionButtons order={order} />
              </div>

              {isExpanded ? <OrderDetail order={order} compact /> : null}
            </div>
          );
        })}
      </div>

      <div className="hidden rounded-lg border border-border bg-white shadow-sm md:block">
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const detailLabel = isExpanded
                ? `Ocultar detalle de ${order.code}`
                : `Ver detalle de ${order.code}`;

              return (
                <Fragment key={order.id}>
                  <TableRow data-state={isExpanded ? "selected" : undefined}>
                    <TableCell className="font-semibold text-dark-blue">{order.code}</TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customer.fullName}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                    </TableCell>
                    <TableCell>{DELIVERY_TYPE_LABELS[order.deliveryType]}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleDetail(order.id)}
                          aria-label={detailLabel}
                          title={detailLabel}
                        >
                          <Eye aria-hidden="true" />
                        </Button>
                        <OrderActionButtons order={order} />
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-secondary/45 p-0">
                        <div className="border-t border-primary/20 p-4">
                          <OrderDetail order={order} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function OrderActionButtons({ order }: { order: Order }) {
  const canCancel =
    order.status === "pendiente_pago" ||
    order.status === "pagado_confirmado" ||
    order.status === "listo_retiro";

  return (
    <>
      <form action={confirmOrderPayment}>
        <input type="hidden" name="id" value={order.id} />
        <Button
          size="icon"
          variant="ghost"
          disabled={order.status !== "pendiente_pago"}
          aria-label={`Confirmar pago de ${order.code}`}
          title={`Confirmar pago de ${order.code}`}
        >
          <CheckCircle2 aria-hidden="true" />
        </Button>
      </form>
      {order.deliveryType === "retiro_local" ? (
        <form action={markOrderReadyForPickup}>
          <input type="hidden" name="id" value={order.id} />
          <Button
            size="icon"
            variant="ghost"
            disabled={order.status !== "pagado_confirmado"}
            aria-label={`Marcar listo para retiro ${order.code}`}
            title={`Marcar listo para retiro ${order.code}`}
          >
            <Store aria-hidden="true" />
          </Button>
        </form>
      ) : (
        <form action={markOrderShipped}>
          <input type="hidden" name="id" value={order.id} />
          <Button
            size="icon"
            variant="ghost"
            disabled={order.status !== "pagado_confirmado"}
            aria-label={`Marcar enviado ${order.code}`}
            title={`Marcar enviado ${order.code}`}
          >
            <PackageCheck aria-hidden="true" />
          </Button>
        </form>
      )}
      <form action={markOrderPickedUp}>
        <input type="hidden" name="id" value={order.id} />
        <Button
          size="icon"
          variant="ghost"
          disabled={order.status !== "listo_retiro"}
          aria-label={`Marcar retirado ${order.code}`}
          title={`Marcar retirado ${order.code}`}
        >
          <PackageCheck aria-hidden="true" />
        </Button>
      </form>
      <form action={cancelOrder}>
        <input type="hidden" name="id" value={order.id} />
        <Button
          size="icon"
          variant="ghost"
          disabled={!canCancel}
          aria-label={`Cancelar pedido ${order.code}`}
          title={`Cancelar pedido ${order.code}`}
        >
          <XCircle aria-hidden="true" />
        </Button>
      </form>
    </>
  );
}

function OrderDetail({ order, compact = false }: { order: Order; compact?: boolean }) {
  return (
    <div className={compact ? "mt-4 rounded-lg border border-border bg-secondary/40 p-3" : "rounded-lg border border-border bg-white p-4 shadow-sm"}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold text-dark-blue">Detalle {order.code}</p>
          <p className="text-sm text-muted-foreground">
            {order.deliveryType === "retiro_local"
              ? `${DELIVERY_TYPE_LABELS.retiro_local}: ${businessConfig.location}, ${businessConfig.city}`
              : `${order.customer.address}, ${order.customer.city}`}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="premium">{DELIVERY_TYPE_LABELS[order.deliveryType]}</Badge>
        {order.deliveryType === "retiro_local" ? (
          <Badge variant="success">Envío $0.00</Badge>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-2">
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between gap-3 rounded-md bg-white p-3 text-sm md:bg-secondary"
            >
              <span>
                {item.productName} x{item.quantity}
              </span>
              <span className="font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-md border border-border bg-white p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrega</span>
            <span>{formatCurrency(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold text-dark-blue">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? "font-bold text-dark-blue" : "font-medium"}>{value}</p>
    </div>
  );
}
