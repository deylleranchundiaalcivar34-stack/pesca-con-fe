import type { OrderStatus, PaymentStatus } from "@/types/pedido";

export type VerifiedPaymentOrder = {
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  productIds: string[];
};

export type PaymentResultKind = "approved" | "canceled" | "error";

const approvedOrderStates = new Set<OrderStatus>([
  "pagado_confirmado",
  "listo_retiro",
  "retirado",
  "enviado",
]);

// El resultado visual se deriva exclusivamente del pedido persistido. Los
// parámetros de la URL solo sirven para localizarlo y nunca prueban un pago.
export function resolvePaymentResult(order: VerifiedPaymentOrder | null): PaymentResultKind {
  if (order?.paymentStatus === "aprobado" && approvedOrderStates.has(order.status)) {
    return "approved";
  }

  if (order?.status === "cancelado" || order?.paymentStatus === "cancelado") {
    return "canceled";
  }

  return "error";
}
