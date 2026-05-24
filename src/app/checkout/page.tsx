import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SectionHeading } from "@/components/shared/section-heading";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Completa tus datos, elige envio o retiro en local, paga por transferencia y envia el comprobante por WhatsApp a Pesca Con Fe.",
};

export default function CheckoutPage() {
  return (
    <PublicShell>
      <section className="bg-secondary py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Checkout"
            title="Genera tu pedido"
            description="Elige envio por Servientrega o retiro en local sin costo de envio. Metodo de pago: transferencia bancaria."
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CheckoutForm />
        </div>
      </section>
    </PublicShell>
  );
}
