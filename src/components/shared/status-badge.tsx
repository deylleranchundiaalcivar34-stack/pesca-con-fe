import type { OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant =
    status === "pagado_confirmado" || status === "retirado"
      ? "success"
      : status === "listo_retiro"
        ? "premium"
        : status === "pendiente_pago"
          ? "warning"
          : status === "cancelado"
            ? "destructive"
            : "default";

  return <Badge variant={variant}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
