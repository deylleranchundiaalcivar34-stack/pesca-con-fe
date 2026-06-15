"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Ejecuta una funcion RPC de pedidos y refresca vistas afectadas.
async function callOrderFunction(name: string, orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(name, { pedido_id_input: orderId });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}

// Confirma que el cliente pago el pedido.
export async function confirmOrderPayment(formData: FormData) {
  await callOrderFunction("confirmar_pago_pedido", String(formData.get("id")));
}

// Marca un pedido como listo para retirar.
export async function markOrderReadyForPickup(formData: FormData) {
  await callOrderFunction("marcar_pedido_listo_retiro", String(formData.get("id")));
}

// Registra que el cliente retiro el pedido.
export async function markOrderPickedUp(formData: FormData) {
  await callOrderFunction("marcar_pedido_retirado", String(formData.get("id")));
}

// Marca un pedido como enviado.
export async function markOrderShipped(formData: FormData) {
  await callOrderFunction("marcar_pedido_enviado", String(formData.get("id")));
}

// Cancela un pedido desde el panel admin.
export async function cancelOrder(formData: FormData) {
  await callOrderFunction("cancelar_pedido", String(formData.get("id")));
}
