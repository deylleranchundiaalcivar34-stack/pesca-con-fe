import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { CheckoutForm } from "@/components/checkout/formulario-checkout";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getBankAccounts, getBusinessConfig } from "@/lib/supabase/data";
import { getCustomerAddresses, getCustomerProfile } from "@/lib/usuario";
import type { CheckoutCustomerDefaults } from "@/types/cliente";

export const metadata: Metadata = {
  title: "Generar pedido",
  description:
    "Revisa tus datos, elige envío o retiro en local y envía el comprobante por WhatsApp a Pesca Con Fe.",
};

// Exige una cuenta con nombre y correo, y deja el contacto para el pedido.
async function getAuthenticatedCheckoutData(): Promise<{
  customerDefaults: CheckoutCustomerDefaults;
  checkoutAddresses: Awaited<ReturnType<typeof getCustomerAddresses>>;
}> {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=config&redirect=%2Fcheckout");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=%2Fcheckout");
  }

  const [profile, addresses] = await Promise.all([
    getCustomerProfile(supabase, user.id),
    getCustomerAddresses(supabase, user.id),
  ]);
  if (
    !profile?.fullName.trim() ||
    !profile.email.trim()
  ) {
    redirect("/mi-cuenta?seccion=perfil&checkout=1");
  }

  const primaryAddress = addresses.find((address) => address.isPrimary) ?? addresses[0];

  return {
    customerDefaults: {
      isAuthenticated: true,
      addressId: primaryAddress?.id,
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email,
      province: primaryAddress?.province,
      city: primaryAddress?.city,
      address: primaryAddress?.address,
      deliveryReference: primaryAddress?.deliveryReference,
      contactPhone: primaryAddress?.contactPhone ?? profile.phone ?? "",
    },
    checkoutAddresses: addresses,
  };
}

// Pagina de checkout con banner, formulario y datos bancarios.
export default async function CheckoutPage() {
  const [checkoutData, bankAccounts, businessConfig] = await Promise.all([
    getAuthenticatedCheckoutData(),
    getBankAccounts(),
    getBusinessConfig(),
  ]);

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-2.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Genera tu pedido"
            description="Revisa tus datos, elige cómo recibir tu compra y envía el comprobante por WhatsApp para confirmar tu pedido."
            className="max-w-5xl [&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CheckoutForm
            customerDefaults={checkoutData.customerDefaults}
            checkoutAddresses={checkoutData.checkoutAddresses}
            bankAccounts={bankAccounts}
            businessConfig={businessConfig}
          />
        </div>
      </section>
    </PublicShell>
  );
}
