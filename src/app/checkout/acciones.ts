"use server";

import { createClient } from "@/lib/supabase/server";
import { getCustomerProfile } from "@/lib/usuario";
import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { DeliveryType, OrderItem } from "@/types/pedido";

type CreateCheckoutOrderInput = {
  customer: {
    fullName: string;
    cedula: string;
    phone: string;
    email?: string;
    addressId?: string;
    addressAlias?: string;
    contactPhone?: string;
    saveAddress?: boolean;
    province?: string;
    city?: string;
    address?: string;
    deliveryReference?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  bankAccount: BankAccount;
  business: BusinessConfig;
  deliveryType: DeliveryType;
};

type CheckoutOrderRpcRow = {
  id: string;
  codigo: string;
};

const checkoutOrderErrorMessage =
  "No pudimos generar el pedido. Intenta nuevamente o contactanos por WhatsApp.";

// Crea el pedido web y, si aplica, guarda una direccion nueva del cliente.
export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Inicia sesion para generar tu pedido.",
      code: null,
      requiresAuth: true,
    };
  }

  const profile = await getCustomerProfile(supabase, user.id);

  if (
    !profile?.fullName.trim() ||
    !profile.cedula.trim() ||
    !profile.phone.trim() ||
    !profile.email.trim()
  ) {
    return {
      ok: false,
      message: "Completa tus datos de cliente antes de generar el pedido.",
      code: null,
      requiresProfile: true,
    };
  }

  let addressId = input.customer.addressId || null;

  if (
    input.deliveryType === "envio_servientrega" &&
    input.customer.saveAddress &&
    !addressId &&
    input.customer.province &&
    input.customer.city &&
    input.customer.address
  ) {
    const { count } = await supabase
      .from("direcciones_cliente")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", user.id)
      .eq("activa", true);

    const { data: savedAddress, error: savedAddressError } = await supabase
      .from("direcciones_cliente")
      .insert({
        cliente_id: user.id,
        alias: input.customer.addressAlias || "Principal",
        provincia: input.customer.province,
        ciudad: input.customer.city,
        direccion: input.customer.address,
        referencia: input.customer.deliveryReference || null,
        celular_contacto: input.customer.contactPhone || null,
        principal: !count,
        activa: true,
      })
      .select("id")
      .maybeSingle();

    if (savedAddressError || !savedAddress) {
      console.error("Checkout address save failed", savedAddressError);
      return {
        ok: false,
        message: "No pudimos guardar la direccion. Intenta nuevamente.",
        code: null,
      };
    }

    addressId = savedAddress.id;
  }

  const payload = {
    cliente_provincia: input.customer.province || null,
    cliente_ciudad: input.customer.city || null,
    cliente_direccion: input.customer.address || null,
    cliente_referencia_entrega: input.customer.deliveryReference || null,
    direccion_cliente_id: addressId,
    tipo_entrega: input.deliveryType,
    subtotal: input.subtotal,
    envio: input.shipping,
    total: input.total,
    estado: "pendiente_pago",
    items: input.items.map((item) => ({
      producto_id: item.productId,
      variante_id: item.variantId ?? null,
      variante_nombre: item.variantName ?? null,
      producto_nombre: item.productName,
      producto_slug: item.productSlug,
      producto_sku: null,
      producto_imagen: item.image,
      categoria_slug: item.categorySlug,
      precio: item.price,
      cantidad: item.quantity,
    })),
  };

  const { data: order, error } = await supabase
    .rpc("crear_pedido_web", { payload })
    .single<CheckoutOrderRpcRow>();

  if (error || !order) {
    console.error("Checkout order creation failed", error);
    return {
      ok: false,
      message: checkoutOrderErrorMessage,
      code: null,
    };
  }

  return {
    ok: true,
    message: "Pedido creado.",
    code: order.codigo as string,
  };
}
