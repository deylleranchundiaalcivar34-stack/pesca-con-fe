"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utilidades";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado.");
  }

  const { data } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!data) {
    throw new Error("No autorizado.");
  }

  return { supabase };
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableText(formData: FormData, key: string) {
  const value = getText(formData, key);
  return value && value !== "root" ? value : null;
}

function revalidateCatalog() {
  updateTag("catalog");
  updateTag("categories");
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/productos");
}

export async function createCatalogNode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = getText(formData, "name");
  const slug = getText(formData, "slug") || slugify(name);
  const level = getText(formData, "level") || "Categoria";

  if (!name || !slug) {
    throw new Error("Completa nombre y slug del nodo.");
  }

  const { error } = await supabase.from("catalogo_nodos").insert({
    parent_id: getNullableText(formData, "parentId"),
    nombre: name,
    slug,
    nivel: level,
    activo: true,
    orden: Number(getText(formData, "sortOrder") || 1),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateCatalog();
  redirect("/admin/catalogo");
}

export async function updateCatalogNode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getText(formData, "id");
  const name = getText(formData, "name");
  const slug = getText(formData, "slug") || slugify(name);
  const parentId = getNullableText(formData, "parentId");

  if (!id || !name || !slug) {
    throw new Error("Completa los datos del nodo.");
  }

  if (parentId === id) {
    throw new Error("Un nodo no puede depender de si mismo.");
  }

  const { error } = await supabase
    .from("catalogo_nodos")
    .update({
      parent_id: parentId,
      nombre: name,
      slug,
      nivel: getText(formData, "level") || "Nivel",
      activo: formData.get("isActive") === "on",
      orden: Number(getText(formData, "sortOrder") || 1),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCatalog();
}

export async function deactivateCatalogNode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getText(formData, "id");

  if (!id) {
    throw new Error("Nodo no encontrado.");
  }

  const { error } = await supabase
    .from("catalogo_nodos")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCatalog();
}
