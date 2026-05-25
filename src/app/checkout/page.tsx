import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getBankAccounts, getBusinessConfig } from "@/lib/supabase/data";
import type { CheckoutCustomerDefaults } from "@/types/customer";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Completa tus datos, elige envío o retiro en local, paga por transferencia y envía el comprobante por WhatsApp a Pesca Con Fe.",
};

async function getCheckoutCustomerDefaults(): Promise<CheckoutCustomerDefaults> {
  if (!hasSupabaseEnv()) {
    return {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  const metadata = user.user_metadata;

  return {
    fullName: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
    cedula: typeof metadata.cedula === "string" ? metadata.cedula : undefined,
    phone: typeof metadata.phone === "string" ? metadata.phone : undefined,
    email: user.email,
  };
}

export default async function CheckoutPage() {
  const [customerDefaults, bankAccounts, businessConfig] = await Promise.all([
    getCheckoutCustomerDefaults(),
    getBankAccounts(),
    getBusinessConfig(),
  ]);

  return (
    <PublicShell>
      <section className="bg-secondary py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Checkout"
            title="Genera tu pedido"
            description="Elige envío por Servientrega o retiro en local sin costo de envío. Método de pago: transferencia bancaria."
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CheckoutForm
            customerDefaults={customerDefaults}
            bankAccounts={bankAccounts}
            businessConfig={businessConfig}
          />
        </div>
      </section>
    </PublicShell>
  );
}
