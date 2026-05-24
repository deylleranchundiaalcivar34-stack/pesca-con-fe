"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Eye, PackageCheck, Store, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types/order";
import { businessConfig } from "@/data/mock-business";
import { mockProducts } from "@/data/mock-products";
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
  SALES_CHANNEL_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { reduceStockForPaidOrder } from "@/lib/stock";

interface AdminOrderTableProps {
  orders: Order[];
}

export function AdminOrderTable({ orders }: AdminOrderTableProps) {
  const [rows, setRows] = useState(orders);
  const [products, setProducts] = useState(mockProducts);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(
    () => rows.filter((order) => status === "all" || order.status === status),
    [rows, status],
  );

  const updateStatus = (order: Order, nextStatus: OrderStatus) => {
    if (nextStatus === "pagado_confirmado" && order.status === "pendiente_pago") {
      setProducts((current) => reduceStockForPaidOrder(current, order.items));
      toast.success("Pago confirmado y stock reducido en modo demo.");
    }

    setRows((current) =>
      current.map((candidate) =>
        candidate.id === order.id ? { ...candidate, status: nextStatus } : candidate,
      ),
    );

    setSelectedOrder((current) =>
      current?.id === order.id ? { ...current, status: nextStatus } : current,
    );
  };

  const lowStockAfterDemo = products.filter(
    (product) => product.stock > 0 && product.stock <= 4,
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-dark-blue">Pedidos y ventas</p>
          <p className="text-sm text-muted-foreground">
            Bajo stock simulado tras confirmaciones: {lowStockAfterDemo}
          </p>
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus | "all")}>
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

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-semibold text-dark-blue">{order.code}</TableCell>
                <TableCell>
                  <p className="font-medium">{order.customer.fullName}</p>
                  <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                </TableCell>
                <TableCell>{SALES_CHANNEL_LABELS[order.channel]}</TableCell>
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
                      onClick={() => setSelectedOrder(order)}
                      aria-label={`Ver detalle de ${order.code}`}
                    >
                      <Eye aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={order.status !== "pendiente_pago"}
                      onClick={() => updateStatus(order, "pagado_confirmado")}
                      aria-label={`Confirmar pago de ${order.code}`}
                    >
                      <CheckCircle2 aria-hidden="true" />
                    </Button>
                    {order.deliveryType === "retiro_local" ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={order.status !== "pagado_confirmado"}
                        onClick={() => updateStatus(order, "listo_retiro")}
                        aria-label={`Marcar listo para retiro ${order.code}`}
                      >
                        <Store aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={order.status !== "pagado_confirmado"}
                        onClick={() => updateStatus(order, "enviado")}
                        aria-label={`Marcar enviado ${order.code}`}
                      >
                        <PackageCheck aria-hidden="true" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={order.status !== "listo_retiro"}
                      onClick={() => updateStatus(order, "retirado")}
                      aria-label={`Marcar retirado ${order.code}`}
                    >
                      <PackageCheck aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={["cancelado", "enviado", "retirado"].includes(order.status)}
                      onClick={() => updateStatus(order, "cancelado")}
                      aria-label={`Cancelar ${order.code}`}
                    >
                      <XCircle aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedOrder ? (
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-dark-blue">
                Detalle {selectedOrder.code}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedOrder.deliveryType === "retiro_local"
                  ? `${DELIVERY_TYPE_LABELS.retiro_local}: ${businessConfig.location}, ${businessConfig.city}`
                  : `${selectedOrder.customer.address}, ${selectedOrder.customer.city}`}
              </p>
            </div>
            <StatusBadge status={selectedOrder.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="premium">{DELIVERY_TYPE_LABELS[selectedOrder.deliveryType]}</Badge>
            {selectedOrder.deliveryType === "retiro_local" ? (
              <Badge variant="success">Envio $0.00</Badge>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            {selectedOrder.items.map((item) => (
              <div key={item.productId} className="flex justify-between rounded-md bg-secondary p-3 text-sm">
                <span>
                  {item.productName} x{item.quantity}
                </span>
                <span className="font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrega</span>
              <span>{formatCurrency(selectedOrder.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-dark-blue">
              <span>Total</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>
          <Badge variant="premium" className="mt-4">
            Stock se descuenta unicamente al confirmar pago.
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
