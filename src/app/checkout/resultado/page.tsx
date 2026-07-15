import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleX, TriangleAlert } from "lucide-react";
import { ClearPaidCart } from "@/components/checkout/limpiar-carrito-pagado";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Resultado del pago",
  description: "Resultado del pago de tu pedido en Pesca Con Fe.",
};

type PaymentResultParams = {
  estado?: string | string[];
  pedido?: string | string[];
};

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<PaymentResultParams>;
}) {
  const params = await searchParams;
  const state = Array.isArray(params.estado) ? params.estado[0] : params.estado;
  const orderCode = Array.isArray(params.pedido) ? params.pedido[0] : params.pedido;
  const approved = state === "aprobado";
  const canceled = state === "cancelado";
  const Icon = approved ? CheckCircle2 : canceled ? CircleX : TriangleAlert;
  const title = approved
    ? "Pago confirmado"
    : canceled
      ? "Pago cancelado"
      : "No pudimos confirmar el pago";
  const description = approved
    ? "Tu pago fue aprobado y el pedido quedó confirmado."
    : canceled
      ? "No se realizó ningún cobro. Tu reserva de productos fue liberada."
      : "No se confirmó el cobro. Revisa tus pedidos o comunícate con la tienda antes de intentar nuevamente.";

  return (
    <PublicShell>
      {approved ? <ClearPaidCart /> : null}
      <section className="bg-secondary px-4 py-14 sm:py-20">
        <Card className="mx-auto max-w-2xl border-primary/25 bg-white text-center shadow-lg">
          <CardHeader>
            <Icon
              className={`mx-auto size-14 ${approved ? "text-emerald-600" : canceled ? "text-muted-foreground" : "text-amber-600"}`}
              aria-hidden="true"
            />
            <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {orderCode ? (
              <p className="mb-3 font-semibold text-dark-blue">Pedido {orderCode}</p>
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
