"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { publicServerError } from "@/lib/safe-server-error";
import { slugify } from "@/lib/utilidades";

// Lee un campo de FormData como texto limpio.
function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// Invalida filtros y productos publicos relacionados con marcas.
function revalidatePublicBrands() {
  updateTag("brands");
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[slug]", "page");
}

// Crea una marca nueva con slug generado.
export async function saveBrand(formData: FormData) {
  const { supabase } = await requireAdmin("catalog.write");
  const name = getText(formData, "name");
  const slug = getText(formData, "slug") || slugify(name);

  if (!name || !slug) {
    throw new Error("Completa nombre y slug de la marca.");
  }

  const { error } = await supabase.from("marcas").insert({
    nombre: name,
    slug,
    activa: true,
  });

  if (error) {
    throw publicServerError("Admin brand creation failed", error, "No se pudo crear la marca.");
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePublicBrands();
  redirect("/admin/marcas");
}

// Actualiza nombre, slug y estado de una marca existente.
export async function updateBrand(formData: FormData) {
  const { supabase } = await requireAdmin("catalog.write");
  const id = getText(formData, "id");
  const name = getText(formData, "name");
  const slug = getText(formData, "slug") || slugify(name);

  if (!id || !name || !slug) {
    throw new Error("Completa nombre y slug de la marca.");
  }

  const { error } = await supabase
    .from("marcas")
    .update({
      nombre: name,
      slug,
      activa: formData.get("isActive") === "on",
    })
    .eq("id", id);

  if (error) {
    throw publicServerError("Admin brand update failed", error, "No se pudo actualizar la marca.");
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePublicBrands();
}

// Desactiva una marca para ocultarla sin borrar historial.
export async function deactivateBrand(formData: FormData) {
  const { supabase } = await requireAdmin("catalog.write");
  const id = getText(formData, "id");

  if (!id) {
    throw new Error("Marca no encontrada.");
  }

  const { error } = await supabase
    .from("marcas")
    .update({ activa: false })
    .eq("id", id);

  if (error) {
    throw publicServerError("Admin brand deactivation failed", error, "No se pudo desactivar la marca.");
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePublicBrands();
}
