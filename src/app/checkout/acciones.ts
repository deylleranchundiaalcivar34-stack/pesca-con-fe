"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createPayPhoneBoxPayment, getPayPhoneConfig } from "@/lib/payphone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isGalapagosDestination,
  isValidEcuadorianCedula,
  normalizeEcuadorianCedula,
  resolveCheckoutDeliveryAddress,
} from "@/lib/checkout-envio";
import { getCustomerProfile } from "@/lib/usuario";
import { isSameCustomerAddress } from "@/lib/direcciones-cliente";
import { consumeRateLimit, getRequestAddress } from "@/lib/rate-limit";
import type { DeliveryType, OrderItem, PaymentMethod } from "@/types/pedido";

type CreateCheckoutOrderInput = {
  idempotencyKey: string;
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
  estado_intento: string;
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
  cliente_nombre_completo: string;
  cliente_cedula: string | null;
  cliente_celular: string | null;
  cliente_provincia: string | null;
  cliente_ciudad: string | null;
  cliente_direccion: string | null;
  cliente_referencia_entrega: string | null;
  subtotal: number | string;
  envio: number | string;
  total: number | string;
  pedido_items: PersistedCheckoutItem[];
};

const checkoutOrderErrorMessage =
  "No pudimos generar el pedido. Revisa disponibilidad y vuelve a intentarlo.";

function isMissingRpc(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "PGRST202" ||
        error.code === "42883" ||
        error.message?.toLowerCase().includes("function") &&
          error.message.toLowerCase().includes("not found")),
  );
}

function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function hasValidCheckoutContract(input: CreateCheckoutOrderInput) {
  const customer = input?.customer;
  const stringsWithinLimits =
    (!customer?.addressId || isUuid(customer.addressId)) &&
    (!customer?.addressAlias || customer.addressAlias.trim().length <= 80) &&
    (!customer?.contactPhone || customer.contactPhone.trim().length <= 30) &&
    (!customer?.province || customer.province.trim().length <= 100) &&
    (!customer?.city || customer.city.trim().length <= 100) &&
    (!customer?.address || customer.address.trim().length <= 500) &&
    (!customer?.deliveryReference || customer.deliveryReference.trim().length <= 500);

  return Boolean(
    customer &&
    isUuid(input.idempotencyKey) &&
    stringsWithinLimits &&
    ["retiro_local", "envio_servientrega"].includes(input.deliveryType) &&
    ["transferencia", "payphone"].includes(input.paymentMethod) &&
    Array.isArray(input.items) &&
    input.items.length > 0 &&
    input.items.length <= 50 &&
    input.items.every(
      (item) =>
        isUuid(item.productId) &&
        (!item.variantId || isUuid(item.variantId)) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99,
    ),
  );
}

// Crea un pedido usando solo identificadores y cantidades; SQL resuelve los valores comerciales.
export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  if (!hasValidCheckoutContract(input)) {
    return { ok: false, message: checkoutOrderErrorMessage, code: null };
  }

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

  const requestHeaders = await headers();
  const [userAllowed, addressAllowed] = await Promise.all([
    consumeRateLimit({
      bucket: "checkout.user",
      identifier: `user:${user.id}`,
      max: 8,
      windowSeconds: 600,
    }),
    consumeRateLimit({
      bucket: "checkout.ip",
      identifier: `ip:${getRequestAddress(requestHeaders)}`,
      max: 20,
      windowSeconds: 600,
    }),
  ]);

  if (!userAllowed || !addressAllowed) {
    return {
      ok: false,
      message: "Has realizado varios intentos. Espera unos minutos antes de volver a intentar.",
      code: null,
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
  const contactPhone = input.customer.contactPhone?.trim() ?? "";
  const province = input.customer.province?.trim() || undefined;
  const city = input.customer.city?.trim() || undefined;
  const manualDeliveryAddress = input.customer.address?.trim() || undefined;
  const deliveryReference = input.customer.deliveryReference?.trim() || undefined;
  const deliveryAddress = resolveCheckoutDeliveryAddress({
    deliveryType: input.deliveryType,
    address: manualDeliveryAddress,
    city,
    province,
  });

  if (contactPhone.length < 9) {
    return {
      ok: false,
      message: "Ingresa un celular de contacto válido.",
      code: null,
    };
  }

  if (isServientrega && (!province || !city)) {
    return {
      ok: false,
      message: "Para envío por Servientrega selecciona la provincia y la ciudad.",
      code: null,
    };
  }

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
    province &&
    city &&
    manualDeliveryAddress
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
          province,
          city,
          address: manualDeliveryAddress,
          deliveryReference,
          contactPhone,
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
        provincia: province,
        ciudad: city,
        direccion: manualDeliveryAddress,
        referencia: deliveryReference || null,
        celular_contacto: contactPhone,
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
    cliente_provincia: province || null,
    cliente_ciudad: city || null,
    cliente_direccion: deliveryAddress,
    cliente_referencia_entrega: deliveryReference || null,
    cliente_celular: contactPhone,
    direccion_cliente_id: addressId,
    tipo_entrega: input.deliveryType,
    items: input.items.map((item) => ({
      producto_id: item.productId,
      variante_id: item.variantId ?? null,
      cantidad: item.quantity,
    })),
  };

  if (input.paymentMethod === "payphone" && payPhoneAdmin) {
    let { data: rpcOrder, error } = await supabase
      .rpc("crear_pedido_payphone_idempotente", {
        payload,
        idempotency_key_input: input.idempotencyKey,
      })
      .single<PayPhoneOrderRpcRow>();

    // Permite publicar la aplicación antes de la migración sin interrumpir el
    // checkout. La ventana de compatibilidad desaparece al aplicar la RPC nueva.
    if (isMissingRpc(error)) {
      const legacy = await supabase
        .rpc("crear_pedido_payphone_con_recargo", { payload })
        .single<Omit<PayPhoneOrderRpcRow, "estado_intento">>();
      rpcOrder = legacy.data
        ? { ...legacy.data, estado_intento: "pendiente" }
        : null;
      error = legacy.error;
    }

    if (error || !rpcOrder) {
      console.error("PayPhone order creation failed", error);
      return {
        ok: false,
        message: checkoutOrderErrorMessage,
        code: null,
      };
    }

    if (rpcOrder.estado_intento === "aprobado") {
      return {
        ok: true,
        message: "El pago ya estaba confirmado.",
        code: rpcOrder.codigo,
        alreadyApproved: true,
      };
    }

    if (!["pendiente", "preparado"].includes(rpcOrder.estado_intento)) {
      return {
        ok: false,
        message: "Este intento de pago ya terminó. Inicia un pago nuevo.",
        code: null,
      };
    }

    try {
      const paymentBox = createPayPhoneBoxPayment({
        amount: Number(rpcOrder.amount_cents),
        clientTransactionId: rpcOrder.client_transaction_id,
        orderCode: rpcOrder.codigo,
      });
      if (rpcOrder.estado_intento === "pendiente") {
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

  let { data: rpcOrder, error } = await supabase
    .rpc("crear_pedido_web_idempotente", {
      payload,
      idempotency_key_input: input.idempotencyKey,
    })
    .single<CheckoutOrderRpcRow>();

  if (isMissingRpc(error)) {
    const legacy = await supabase
      .rpc("crear_pedido_web", { payload })
      .single<CheckoutOrderRpcRow>();
    rpcOrder = legacy.data;
    error = legacy.error;
  }

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
      "codigo, cliente_nombre_completo, cliente_cedula, cliente_celular, cliente_provincia, cliente_ciudad, cliente_direccion, cliente_referencia_entrega, subtotal, envio, total, pedido_items(id, producto_id, variante_id, variante_nombre, variante_sku, producto_nombre, producto_slug, producto_imagen, categoria_slug, precio, cantidad)",
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
      customer: {
        fullName: persistedOrder.cliente_nombre_completo,
        cedula: persistedOrder.cliente_cedula ?? undefined,
        phone: persistedOrder.cliente_celular ?? "",
        contactPhone: persistedOrder.cliente_celular ?? undefined,
        province: persistedOrder.cliente_provincia ?? undefined,
        city: persistedOrder.cliente_ciudad ?? undefined,
        address: persistedOrder.cliente_direccion ?? undefined,
        deliveryReference: persistedOrder.cliente_referencia_entrega ?? undefined,
      },
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

// Cerrar la cajita solo solicita cancelación. El pedido se conserva hasta que
// PayPhone confirme un estado terminal o la reconciliación expire la reserva.
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
