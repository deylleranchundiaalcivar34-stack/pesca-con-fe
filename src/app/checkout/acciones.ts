"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomerProfile } from "@/lib/usuario";
import type { DeliveryType, OrderItem } from "@/types/pedido";

type CreateCheckoutOrderInput = {
  customer: {
    addressId?: string;
    addressAlias?: string;
    contactPhone?: string;
    saveAddress?: boolean;
    province?: string;
    city?: string;
    address?: string;
    deliveryReference?: string;
  };
  items: Array<Pick<OrderItem, "productId" | "variantId" | "quantity">>;
  deliveryType: DeliveryType;
};

type CheckoutOrderRpcRow = {
  id: string;
  codigo: string;
};

type PersistedCheckoutItem = {
  id: string;
  producto_id: string | null;
  variante_id: string | null;
  variante_nombre: string | null;
  variante_sku: string | null;
  producto_nombre: string;
  producto_slug: string;
  producto_imagen: string | null;
  categoria_slug: string;
  precio: number | string;
  cantidad: number;
};

type PersistedCheckoutOrder = {
  codigo: string;
  subtotal: number | string;
  envio: number | string;
  total: number | string;
  pedido_items: PersistedCheckoutItem[];
};

const checkoutOrderErrorMessage =
  "No pudimos generar el pedido. Revisa disponibilidad y vuelve a intentarlo.";

// Crea un pedido usando solo identificadores y cantidades; SQL resuelve los valores comerciales.
export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Inicia sesión para generar tu pedido.",
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
        message: "No pudimos guardar la dirección. Intenta nuevamente.",
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
    items: input.items.map((item) => ({
      producto_id: item.productId,
      variante_id: item.variantId ?? null,
      cantidad: item.quantity,
    })),
  };

  const { data: rpcOrder, error } = await supabase
    .rpc("crear_pedido_web", { payload })
    .single<CheckoutOrderRpcRow>();

  if (error || !rpcOrder) {
    console.error("Checkout order creation failed", error);
    return {
      ok: false,
      message: checkoutOrderErrorMessage,
      code: null,
    };
  }

  const { data: persistedOrder, error: persistedOrderError } = await supabase
    .from("pedidos")
    .select(
      "codigo, subtotal, envio, total, pedido_items(id, producto_id, variante_id, variante_nombre, variante_sku, producto_nombre, producto_slug, producto_imagen, categoria_slug, precio, cantidad)",
    )
    .eq("id", rpcOrder.id)
    .single<PersistedCheckoutOrder>();

  if (persistedOrderError || !persistedOrder) {
    console.error("Checkout order readback failed", persistedOrderError);
    return {
      ok: false,
      message: checkoutOrderErrorMessage,
      code: null,
    };
  }

  revalidatePath("/mi-cuenta");
  revalidatePath("/admin/pedidos");

  return {
    ok: true,
    message: "Pedido creado.",
    code: persistedOrder.codigo,
    order: {
      items: persistedOrder.pedido_items.map<OrderItem>((item) => ({
        productId: item.producto_id ?? item.id,
        variantId: item.variante_id ?? undefined,
        variantName: item.variante_nombre ?? undefined,
        variantSku: item.variante_sku ?? undefined,
        productName: item.producto_nombre,
        productSlug: item.producto_slug,
        image: item.producto_imagen ?? "",
        price: Number(item.precio),
        quantity: Number(item.cantidad),
        categorySlug: item.categoria_slug,
      })),
      subtotal: Number(persistedOrder.subtotal),
      shipping: Number(persistedOrder.envio),
      total: Number(persistedOrder.total),
    },
  };
}
