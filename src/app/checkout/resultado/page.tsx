import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleX, TriangleAlert } from "lucide-react";
import { ClearPaidCart } from "@/components/checkout/limpiar-carrito-pagado";
import { ClearPurchasedWishlist } from "@/components/checkout/limpiar-deseos-comprados";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePaymentResult, type VerifiedPaymentOrder } from "@/lib/resultado-pago";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types/pedido";

export const metadata: Metadata = {
  title: "Resultado del pago",
  description: "Resultado del pago de tu pedido en Pesca Con Fe.",
};

type PaymentResultParams = {
  pedido?: string | string[];
};

const orderCodePattern = /^[a-z0-9-]{1,64}$/i;

// Recupera únicamente un pedido propio. El estado mostrado nunca se deriva de
// parámetros manipulables de la URL.
async function getVerifiedPaymentOrder(orderCode?: string): Promise<VerifiedPaymentOrder | null> {
  if (!orderCode || !orderCodePattern.test(orderCode)) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("pedidos")
    .select("codigo, estado, estado_pago, pedido_items(producto_id)")
    .eq("codigo", orderCode)
    .eq("cliente_id", user.id)
    .eq("es_borrador_pago", false)
    .maybeSingle();

  if (error || !data) return null;

  const order = data as {
    codigo: string;
    estado: OrderStatus;
    estado_pago: PaymentStatus;
    pedido_items?: Array<{ producto_id?: string | null }>;
  };

  return {
    code: order.codigo,
    status: order.estado,
    paymentStatus: order.estado_pago,
    productIds: Array.from(
      new Set(
        (order.pedido_items ?? []).flatMap((item) =>
          item.producto_id ? [item.producto_id] : [],
        ),
      ),
    ),
  };
}

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<PaymentResultParams>;
}) {
  const params = await searchParams;
  const requestedOrderCode = Array.isArray(params.pedido) ? params.pedido[0] : params.pedido;
  const order = await getVerifiedPaymentOrder(requestedOrderCode);
  const result = resolvePaymentResult(order);
  const approved = result === "approved";
  const canceled = result === "canceled";
  const purchasedProductIds = approved ? order?.productIds ?? [] : [];
  const Icon = approved ? CheckCircle2 : canceled ? CircleX : TriangleAlert;
  const title = approved
    ? "Pago confirmado"
    : canceled
      ? "Pago cancelado"
      : "No pudimos confirmar el pago";
  const description = approved
    ? "Tu pago fue aprobado y el pedido quedó confirmado."
    : canceled
      ? "El pedido consta como cancelado. Si ves un cargo, comunícate con la tienda."
      : "No se confirmó el cobro. Revisa tus pedidos o comunícate con la tienda antes de intentar nuevamente.";

  return (
    <PublicShell>
      {approved ? (
        <>
          <ClearPaidCart />
          <ClearPurchasedWishlist productIds={purchasedProductIds} />
        </>
      ) : null}
      <section className="bg-secondary px-4 py-14 sm:py-20">
        <Card className="mx-auto max-w-2xl border-primary/25 bg-white text-center shadow-lg">
          <CardHeader>
            <Icon
              className={`mx-auto size-14 ${
                approved
                  ? "text-emerald-600"
                  : canceled
                    ? "text-muted-foreground"
                    : "text-amber-600"
              }`}
              aria-hidden="true"
            />
            <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {order ? (
              <p className="mb-3 font-semibold text-dark-blue">Pedido {order.code}</p>
            ) : null}
            <p className="text-muted-foreground">{description}</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/mi-cuenta">Ver mis pedidos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={approved ? "/productos" : "/checkout"}>
                  {approved ? "Seguir comprando" : "Volver al checkout"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
