"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SubmittedItem = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  price?: unknown;
};

const paymentMethods = new Set(["efectivo", "transferencia", "tarjeta", "otro"]);

// Registra la venta mediante una función transaccional: o descuenta todo el stock o no guarda nada.
export async function createPhysicalSale(input: {
  items: SubmittedItem[];
  note?: string;
  paymentMethod?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: admin } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!admin) throw new Error("No autorizado.");
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) {
    throw new Error("Agrega entre uno y cincuenta artículos.");
  }

  const items = input.items.map((item) => ({
    productId: String(item.productId ?? "").trim(),
    variantId: String(item.variantId ?? "").trim(),
    quantity: Number(item.quantity),
    price: Number(item.price),
  }));

  if (items.some((item) => !/^[0-9a-f-]{36}$/i.test(item.productId) || (item.variantId && !/^[0-9a-f-]{36}$/i.test(item.variantId)) || !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.price) || item.price < 0)) {
    throw new Error("Revisa los productos, cantidades y precios de la venta.");
  }

  const paymentMethod = paymentMethods.has(input.paymentMethod ?? "")
    ? input.paymentMethod!
    : "efectivo";
  const { data, error } = await supabase.rpc("registrar_venta_fisica", {
    items_input: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      price: item.price,
    })),
    nota_input: input.note?.trim() || null,
    metodo_pago_input: paymentMethod,
  });

  if (error || !data) throw new Error(error?.message ?? "No se pudo registrar la venta física.");

  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/producto/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/ventas-fisicas");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");

  return { code: String(data) };
}
