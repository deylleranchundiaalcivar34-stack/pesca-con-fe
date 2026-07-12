"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProductImage } from "@/lib/cloudinary";
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

function getRequiredText(formData: FormData, key: string, label: string) {
  const value = getText(formData, key);

  if (!value) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value;
}

function getOptionalUrl(formData: FormData, key: string, label: string) {
  const value = getText(formData, key);

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(`${label} debe ser una URL http o https valida.`);
  }

  return value;
}

function validateLength(value: string, maximum: number, label: string) {
  if (value.length > maximum) {
    throw new Error(`${label} no puede superar ${maximum} caracteres.`);
  }
}

const catalogImageMaxBytes = 5 * 1024 * 1024;
const allowedCatalogImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedCatalogImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

function getCatalogImageFile(formData: FormData) {
  const value = formData.get("imageFile");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const extension = value.name.split(".").pop()?.toLowerCase() ?? "";

  if (!allowedCatalogImageTypes.has(value.type) || !allowedCatalogImageExtensions.has(extension)) {
    throw new Error("La imagen debe ser JPG, JPEG, PNG o WebP.");
  }

  if (value.size > catalogImageMaxBytes) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  return value;
}

function revalidateCatalog() {
  updateTag("catalog");
  updateTag("categories");
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[...slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/productos");
}

async function getNextSiblingOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentId: string | null,
) {
  let query = supabase
    .from("catalogo_nodos")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1);

  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.orden ?? 0) + 1;
}

export async function createCatalogNode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = getText(formData, "name");
  const slug = getText(formData, "slug") || slugify(name);
  const level = getText(formData, "level") || "Categoria";
  const parentId = getNullableText(formData, "parentId");

  if (!name || !slug) {
    throw new Error("Completa nombre y slug del nodo.");
  }

  const sortOrder = await getNextSiblingOrder(supabase, parentId);
  const { error } = await supabase.from("catalogo_nodos").insert({
    parent_id: parentId,
    nombre: name,
    slug,
    nivel: level,
    activo: true,
    orden: sortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateCatalog();
  redirect("/admin/catalogo");
}

export async function updateCatalogNode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getRequiredText(formData, "id", "El nodo");
  const name = getRequiredText(formData, "name", "El nombre");
  const slug = getRequiredText(formData, "slug", "El slug");
  const level = getRequiredText(formData, "level", "El nivel");
  const parentId = getNullableText(formData, "parentId");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("El slug solo puede contener letras minusculas, numeros y guiones.");
  }

  if (parentId === id) {
    throw new Error("Un nodo no puede depender de si mismo.");
  }

  validateLength(name, 160, "El nombre");
  validateLength(level, 80, "El nivel");

  const { data: currentNode, error: currentNodeError } = await supabase
    .from("catalogo_nodos")
    .select("parent_id, orden")
    .eq("id", id)
    .single();

  if (currentNodeError) {
    throw new Error(currentNodeError.message);
  }

  const sortOrder =
    currentNode.parent_id === parentId
      ? currentNode.orden
      : await getNextSiblingOrder(supabase, parentId);

  const { error } = await supabase
    .from("catalogo_nodos")
    .update({
      parent_id: parentId,
      nombre: name,
      slug,
      nivel: level,
      activo: formData.get("isActive") === "on",
      orden: sortOrder,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCatalog();
}

export async function reorderCatalogSiblings(parentId: string | null, orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  if (!orderedIds.length || new Set(orderedIds).size !== orderedIds.length) {
    throw new Error("El nuevo orden del catalogo no es valido.");
  }

  let siblingQuery = supabase.from("catalogo_nodos").select("id");
  siblingQuery = parentId
    ? siblingQuery.eq("parent_id", parentId)
    : siblingQuery.is("parent_id", null);
  const { data: siblings, error: siblingsError } = await siblingQuery;

  if (siblingsError) {
    throw new Error(siblingsError.message);
  }

  const storedIds = (siblings ?? []).map((sibling) => sibling.id).sort();
  const submittedIds = [...orderedIds].sort();

  if (
    storedIds.length !== submittedIds.length ||
    storedIds.some((storedId, index) => storedId !== submittedIds[index])
  ) {
    throw new Error("Solo puedes ordenar secciones de la misma categoria padre.");
  }

  const updates = await Promise.all(
    orderedIds.map((nodeId, index) =>
      supabase.from("catalogo_nodos").update({ orden: index + 1 }).eq("id", nodeId),
    ),
  );
  const failedUpdate = updates.find((result) => result.error);

  if (failedUpdate?.error) {
    throw new Error(failedUpdate.error.message);
  }

  revalidateCatalog();
}

export async function updateCatalogNodeContent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getRequiredText(formData, "id", "La seccion del catalogo");
  const pageTitle = getText(formData, "landingTitle");
  const shortDescription = getText(formData, "shortDescription");
  const informativeText = getText(formData, "technicalContent");
  const imageAlt = getText(formData, "imageAlt");
  const imageFile = getCatalogImageFile(formData);
  const removeImage = getText(formData, "removeImage") === "true";
  const currentImage = getOptionalUrl(formData, "currentImage", "La imagen actual");

  validateLength(pageTitle, 200, "El titulo de la pagina");
  validateLength(shortDescription, 1000, "La descripcion corta");
  validateLength(informativeText, 20000, "El texto informativo");
  validateLength(imageAlt, 300, "El texto alternativo");

  let mainImage = removeImage ? null : currentImage;

  if (imageFile) {
    const upload = await uploadProductImage(imageFile, "pesca-con-fe/catalogo");
    mainImage = upload.secure_url;
  }

  const { data: currentContent, error: currentContentError } = await supabase
    .from("catalogo_nodos")
    .select("nombre, meta_title, meta_description, open_graph_image, indexable")
    .eq("id", id)
    .single();

  if (currentContentError) {
    throw new Error(currentContentError.message);
  }

  const { error } = await supabase
    .from("catalogo_nodos")
    .update({
      titulo_landing: pageTitle || null,
      descripcion_corta: shortDescription || null,
      contenido_tecnico: informativeText || null,
      imagen: mainImage,
      imagen_alt: imageAlt || null,
      meta_title: currentContent.meta_title?.trim() || pageTitle || currentContent.nombre,
      meta_description: currentContent.meta_description?.trim() || shortDescription || null,
      open_graph_image: currentContent.open_graph_image?.trim() || mainImage,
      indexable: currentContent.indexable ?? true,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateCatalog();
  redirect(`/admin/catalogo/${id}/contenido?guardado=1`);
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
