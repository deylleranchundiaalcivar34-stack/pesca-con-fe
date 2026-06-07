import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getBankAccounts, getBusinessConfig } from "@/lib/supabase/data";
import {
  getCustomerAddresses,
  getCustomerProfile,
  getPublicUserSummary,
} from "@/lib/user";
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

  const [profile, addresses] = await Promise.all([
    getCustomerProfile(supabase, user.id),
    getCustomerAddresses(supabase, user.id),
  ]);
  const summary = getPublicUserSummary(user, profile);
  const primaryAddress = addresses.find((address) => address.isPrimary) ?? addresses[0];

  return {
    isAuthenticated: true,
    addressId: primaryAddress?.id,
    fullName: summary.fullName,
    cedula: summary.cedula,
    phone: summary.phone,
    email: summary.email,
    province: primaryAddress?.province,
    city: primaryAddress?.city,
    address: primaryAddress?.address,
    deliveryReference: primaryAddress?.deliveryReference,
    contactPhone: primaryAddress?.contactPhone ?? summary.phone,
  };
}

export default async function CheckoutPage() {
  const [customerDefaults, checkoutAddresses, bankAccounts, businessConfig] = await Promise.all([
    getCheckoutCustomerDefaults(),
    hasSupabaseEnv()
      ? createClient().then(async (supabase) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          return user ? getCustomerAddresses(supabase, user.id) : [];
        })
      : Promise.resolve([]),
    getBankAccounts(),
    getBusinessConfig(),
  ]);

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-2.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Genera tu pedido"
            description="Completa tus datos, elige cómo recibir tu compra y envía el comprobante por WhatsApp para confirmar tu pedido."
            className="max-w-5xl [&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CheckoutForm
            customerDefaults={customerDefaults}
            checkoutAddresses={checkoutAddresses}
            bankAccounts={bankAccounts}
            businessConfig={businessConfig}
          />
        </div>
      </section>
    </PublicShell>
  );
}
