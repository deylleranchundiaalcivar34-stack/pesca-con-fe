"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

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

export async function saveBrand(formData: FormData) {
  const { supabase } = await requireAdmin();
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
    throw new Error(error.message);
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  redirect("/admin/marcas");
}

export async function updateBrand(formData: FormData) {
  const { supabase } = await requireAdmin();
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
    throw new Error(error.message);
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
}

export async function deactivateBrand(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getText(formData, "id");

  if (!id) {
    throw new Error("Marca no encontrada.");
  }

  const { error } = await supabase
    .from("marcas")
    .update({ activa: false })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
}
