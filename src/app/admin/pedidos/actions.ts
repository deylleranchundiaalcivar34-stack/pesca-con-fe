"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function callOrderFunction(name: string, orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(name, { pedido_id_input: orderId });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/ventas");
}

export async function confirmOrderPayment(formData: FormData) {
  await callOrderFunction("confirmar_pago_pedido", String(formData.get("id")));
}

export async function markOrderReadyForPickup(formData: FormData) {
  await callOrderFunction("marcar_pedido_listo_retiro", String(formData.get("id")));
}

export async function markOrderPickedUp(formData: FormData) {
  await callOrderFunction("marcar_pedido_retirado", String(formData.get("id")));
}

export async function markOrderShipped(formData: FormData) {
  await callOrderFunction("marcar_pedido_enviado", String(formData.get("id")));
}

export async function cancelOrder(formData: FormData) {
  await callOrderFunction("cancelar_pedido", String(formData.get("id")));
}
