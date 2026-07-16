"use server";

import { revalidatePath } from "next/cache";
import { createPayPhoneBoxPayment, getPayPhoneConfig } from "@/lib/payphone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isGalapagosDestination,
  isValidEcuadorianCedula,
  normalizeEcuadorianCedula,
} from "@/lib/checkout-envio";
import { getCustomerProfile } from "@/lib/usuario";
import { isSameCustomerAddress } from "@/lib/direcciones-cliente";
import type { DeliveryType, OrderItem, PaymentMethod } from "@/types/pedido";

type CreateCheckoutOrderInput = {
  customer: {
    addressId?: string;
    addressAlias?: string;
    cedula?: string;
    contactPhone?: string;
    saveAddress?: boolean;
    province?: string;
    city?: string;
    address?: string;
    deliveryReference?: string;
  };
  items: Array<Pick<OrderItem, "productId" | "variantId" | "quantity">>;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
};

type CheckoutOrderRpcRow = {
  id: string;
  codigo: string;
};

type PayPhoneOrderRpcRow = CheckoutOrderRpcRow & {
  client_transaction_id: string;
  amount_cents: number;
  expires_at: string;
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
    !profile.email.trim()
  ) {
    return {
      ok: false,
      message: "Completa tus datos de cliente antes de generar el pedido.",
      code: null,
      requiresProfile: true,
    };
  }

  const isServientrega = input.deliveryType === "envio_servientrega";
  const isGalapagosDelivery =
    isServientrega && isGalapagosDestination(input.customer.province, input.customer.city);
  const cedula = normalizeEcuadorianCedula(input.customer.cedula ?? "");

  if (isServientrega && !isValidEcuadorianCedula(cedula)) {
    return {
      ok: false,
      message: "Para envío por Servientrega ingresa una cédula ecuatoriana válida.",
      code: null,
    };
  }

  if (isGalapagosDelivery && input.paymentMethod === "payphone") {
    return {
      ok: false,
      message: "Los envíos a Galápagos se cotizan por WhatsApp antes de pagar.",
      code: null,
    };
  }

  if (isServientrega) {
    const { data: updatedProfile, error: cedulaError } = await supabase
      .from("perfiles_cliente")
      .update({ cedula })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (cedulaError || !updatedProfile) {
      console.error("Checkout cedula registration failed", cedulaError);
      return {
        ok: false,
        message: "No pudimos validar la cédula para el envío. Intenta nuevamente.",
        code: null,
      };
    }
  }

  let payPhoneAdmin: ReturnType<typeof createAdminClient> | null = null;

  if (input.paymentMethod === "payphone") {
    try {
      getPayPhoneConfig();
      payPhoneAdmin = createAdminClient();
    } catch (error) {
      console.error(
        "PayPhone checkout configuration is incomplete",
        error instanceof Error ? error.message : "Unknown configuration error",
      );
      return {
        ok: false,
        message: "El pago con tarjeta todavía no está disponible. Intenta por transferencia.",
        code: null,
      };
    }
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
    const { data: activeAddresses, error: activeAddressesError } = await supabase
      .from("direcciones_cliente")
      .select("id, provincia, ciudad, direccion, referencia, celular_contacto, principal")
      .eq("cliente_id", user.id)
      .eq("activa", true);

    if (activeAddressesError) {
      console.error("Checkout address lookup failed", activeAddressesError);
      return {
        ok: false,
        message: "No pudimos revisar tus direcciones guardadas. Intenta nuevamente.",
        code: null,
      };
    }

    const matchingAddress = activeAddresses?.find((savedAddress) =>
      isSameCustomerAddress(
        {
          province: savedAddress.provincia,
          city: savedAddress.ciudad,
          address: savedAddress.direccion,
          deliveryReference: savedAddress.referencia,
          contactPhone: savedAddress.celular_contacto,
        },
        {
          province: input.customer.province!,
          city: input.customer.city!,
          address: input.customer.address!,
          deliveryReference: input.customer.deliveryReference,
          contactPhone: input.customer.contactPhone,
        },
      ),
    );

    if (matchingAddress) {
      addressId = matchingAddress.id;
    } else {

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
        principal: !activeAddresses?.length,
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
  }

  const payload = {
    cliente_cedula: isServientrega ? cedula : null,
    cliente_provincia: input.customer.province || null,
    cliente_ciudad: input.customer.city || null,
    cliente_direccion: input.customer.address || null,
    cliente_referencia_entrega: input.customer.deliveryReference || null,
    cliente_celular: input.customer.contactPhone || null,
    direccion_cliente_id: addressId,
    tipo_entrega: input.deliveryType,
    items: input.items.map((item) => ({
      producto_id: item.productId,
      variante_id: item.variantId ?? null,
      cantidad: item.quantity,
    })),
  };

  if (input.paymentMethod === "payphone" && payPhoneAdmin) {
    const { data: rpcOrder, error } = await supabase
      .rpc("crear_pedido_payphone_con_recargo", { payload })
      .single<PayPhoneOrderRpcRow>();

    if (error || !rpcOrder) {
      console.error("PayPhone order creation failed", error);
      return {
        ok: false,
        message: checkoutOrderErrorMessage,
        code: null,
      };
    }

    try {
      const paymentBox = createPayPhoneBoxPayment({
        amount: Number(rpcOrder.amount_cents),
        clientTransactionId: rpcOrder.client_transaction_id,
        orderCode: rpcOrder.codigo,
      });
      const { error: preparationError } = await payPhoneAdmin.rpc(
        "registrar_preparacion_payphone",
        {
          client_transaction_id_input: rpcOrder.client_transaction_id,
          // La Cajita no crea un paymentId previo. La tabla conserva este
          // identificador único para dejar el intento listo para Confirm.
          provider_prepare_id_input: `cajita-${rpcOrder.client_transaction_id}`,
        },
      );

      if (preparationError) {
        throw new Error("No se pudo registrar la preparación del pago.");
      }

      revalidatePath("/mi-cuenta");
      revalidatePath("/admin/pedidos");

      return {
        ok: true,
        message: "Pago preparado.",
        code: rpcOrder.codigo,
        paymentBox,
      };
    } catch {
      const safeCode = "BOX_SETUP_FAILED";
      const safeMessage = "No se pudo preparar el pago con PayPhone.";

      console.error("PayPhone box preparation failed", safeCode);
      await payPhoneAdmin.rpc("descartar_intento_payphone_servidor", {
        client_transaction_id_input: rpcOrder.client_transaction_id,
      });

      return {
        ok: false,
        message: `${safeMessage} Puedes intentar nuevamente o pagar por transferencia.`,
        code: null,
      };
    }
  }

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

// El pedido de PayPhone es temporal hasta que el callback confirme el cobro.
// Al cerrar la Cajita se borra junto con sus reservas de inventario.
export async function discardPayPhoneCheckout(clientTransactionId: string) {
  if (!/^PCF-[a-f0-9]{32}$/i.test(clientTransactionId)) {
    return { ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("descartar_intento_payphone_servidor", {
    client_transaction_id_input: clientTransactionId,
    cliente_id_input: user.id,
  });

  if (error) {
    console.error("PayPhone checkout discard failed", error);
    return { ok: false };
  }

  if (data) {
    revalidatePath("/mi-cuenta");
    revalidatePath("/admin/pedidos");
  }

  return { ok: Boolean(data) };
}
