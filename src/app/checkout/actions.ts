"use server";

import { createClient } from "@/lib/supabase/server";
import type { BankAccount, BusinessConfig } from "@/types/business";
import type { DeliveryType, OrderItem } from "@/types/order";

type CreateCheckoutOrderInput = {
  customer: {
    fullName: string;
    cedula: string;
    phone: string;
    email?: string;
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

export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    cliente_id: user?.id ?? null,
    cliente_nombre_completo: input.customer.fullName,
    cliente_cedula: input.customer.cedula,
    cliente_celular: input.customer.phone,
    cliente_correo: input.customer.email || null,
    cliente_provincia: input.customer.province || null,
    cliente_ciudad: input.customer.city || null,
    cliente_direccion: input.customer.address || null,
    cliente_referencia_entrega: input.customer.deliveryReference || null,
    tipo_entrega: input.deliveryType,
    direccion_retiro_snapshot:
      input.deliveryType === "retiro_local"
        ? {
            direccion: input.business.location,
            ciudad: input.business.city,
            horario: input.business.schedule,
            telefonos: input.business.phones,
            instrucciones: input.business.localPickupInstructions,
          }
        : null,
    cuenta_bancaria_id: input.bankAccount.id,
    cuenta_bancaria_snapshot: {
      banco: input.bankAccount.bank,
      titular: input.bankAccount.owner,
      tipo_cuenta: input.bankAccount.accountType,
      numero_cuenta: input.bankAccount.accountNumber,
      cedula: input.bankAccount.cedula ?? null,
    },
    subtotal: input.subtotal,
    envio: input.shipping,
    total: input.total,
    estado: "pendiente_pago",
    canal: "web",
    creado_por: user?.id ?? null,
    items: input.items.map((item) => ({
      producto_id: item.productId,
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
