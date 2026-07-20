"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { publicServerError } from "@/lib/safe-server-error";

type OrderFunctionName =
  | "confirmar_pago_pedido"
  | "marcar_pedido_listo_retiro"
  | "marcar_pedido_retirado"
  | "marcar_pedido_enviado"
  | "cancelar_pedido";

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

function getOrderId(formData: FormData) {
  const orderId = String(formData.get("id") ?? "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    throw new Error("Pedido no válido.");
  }

  return orderId;
}

// Ejecuta una funcion RPC de pedidos y refresca vistas afectadas.
async function callOrderFunction(
  supabase: AdminClient,
  name: OrderFunctionName,
  orderId: string,
) {
  const { error } = await supabase.rpc(name, { pedido_id_input: orderId });

  if (error) {
    throw publicServerError("Admin order transition failed", error, "No se pudo actualizar el pedido.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}

// Confirma que el cliente pago el pedido.
export async function confirmOrderPayment(formData: FormData) {
  const orderId = getOrderId(formData);
  const { supabase } = await requireAdmin("orders.write");
  const { data: order, error } = await supabase
    .from("pedidos")
    .select("metodo_pago")
    .eq("id", orderId)
    .single<{ metodo_pago: string }>();

  if (error || !order) {
    throw new Error("No se pudo validar el método de pago del pedido.");
  }

  if (order.metodo_pago !== "transferencia") {
    throw new Error("Los pagos PayPhone solo se confirman mediante PayPhone.");
  }

  await callOrderFunction(supabase, "confirmar_pago_pedido", orderId);
}

// Marca un pedido como listo para retirar.
export async function markOrderReadyForPickup(formData: FormData) {
  const { supabase } = await requireAdmin("orders.write");
  await callOrderFunction(supabase, "marcar_pedido_listo_retiro", getOrderId(formData));
}

// Registra que el cliente retiro el pedido.
export async function markOrderPickedUp(formData: FormData) {
  const { supabase } = await requireAdmin("orders.write");
  await callOrderFunction(supabase, "marcar_pedido_retirado", getOrderId(formData));
}

// Marca un pedido como enviado.
export async function markOrderShipped(formData: FormData) {
  const { supabase } = await requireAdmin("orders.write");
  await callOrderFunction(supabase, "marcar_pedido_enviado", getOrderId(formData));
}

// Cancela un pedido desde el panel admin.
export async function cancelOrder(formData: FormData) {
  const { supabase } = await requireAdmin("orders.write");
  await callOrderFunction(supabase, "cancelar_pedido", getOrderId(formData));
}
