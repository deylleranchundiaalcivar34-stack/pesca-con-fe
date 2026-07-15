"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProductImage } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

// Verifica que el usuario tenga permisos antes de modificar productos.
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

  return { supabase, userId: user.id };
}

// Lee un campo de formulario como texto limpio.
function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// Invalida cache publica despues de cambios que afectan la tienda.
function revalidatePublicProducts() {
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[slug]", "page");
  revalidatePath("/producto/[slug]", "page");
}

// Extrae el ID de YouTube desde un ID directo o desde URLs comunes.
function getYouTubeVideoId(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host.endsWith("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) {
        return watchId;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      const videoPath = ["embed", "shorts", "live"].find((segment) =>
        parts.includes(segment),
      );
      if (videoPath) {
        return parts[parts.indexOf(videoPath) + 1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

// Busca marca, categoria y subcategoria relacionadas antes de guardar.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function resolveProductRelations(formData: FormData) {
  const { supabase } = await requireAdmin();
  const brandName = getText(formData, "brand");
  const categorySlug = getText(formData, "categorySlug");
  const subcategorySlug = getText(formData, "subcategorySlug");

  const [{ data: brand }, { data: category }] = await Promise.all([
    supabase.from("marcas").select("id").eq("nombre", brandName).maybeSingle(),
    supabase.from("categorias").select("id").eq("slug", categorySlug).maybeSingle(),
  ]);

  if (!category) {
    throw new Error("Categoría no encontrada.");
  }

  const { data: subcategory } = await supabase
    .from("subcategorias")
    .select("id")
    .eq("categoria_id", category.id)
    .eq("slug", subcategorySlug)
    .maybeSingle();

  return {
    supabase,
    brandId: brand?.id ?? null,
    categoryId: category.id,
    subcategoryId: subcategory?.id ?? null,
  };
}

// Resuelve la ruta flexible del catalogo y conserva columnas antiguas cuando existen.
async function resolveFlexibleProductRelations(formData: FormData) {
  const { supabase } = await requireAdmin();
  const brandName = getText(formData, "brand");
  const catalogNodeIdInput = getText(formData, "catalogNodeId");
  const catalogNodeId = catalogNodeIdInput.startsWith("fallback-")
    ? ""
    : catalogNodeIdInput;
  let categorySlug = getText(formData, "categorySlug");
  let subcategorySlug = getText(formData, "subcategorySlug");

  if (catalogNodeId) {
    const { data: nodes } = await supabase
      .from("catalogo_nodos")
      .select("id, parent_id, slug")
      .eq("activo", true);
    const nodeById = new Map((nodes ?? []).map((node) => [node.id, node]));
    const path = [];
    let current = nodeById.get(catalogNodeId);

    while (current) {
      path.unshift(current);
      current = current.parent_id ? nodeById.get(current.parent_id) : undefined;
    }

    categorySlug = path[0]?.slug ?? categorySlug;
    subcategorySlug = path[1]?.slug ?? subcategorySlug;
  }

  const [{ data: brand }, { data: category }] = await Promise.all([
    supabase.from("marcas").select("id").eq("nombre", brandName).maybeSingle(),
    supabase.from("categorias").select("id").eq("slug", categorySlug).maybeSingle(),
  ]);

  const { data: subcategory } = category
    ? await supabase
        .from("subcategorias")
        .select("id")
        .eq("categoria_id", category.id)
        .eq("slug", subcategorySlug)
        .maybeSingle()
    : { data: null };

  return {
    supabase,
    brandId: brand?.id ?? null,
    categoryId: category?.id ?? null,
    subcategoryId: subcategory?.id ?? null,
    catalogNodeId: catalogNodeId || null,
  };
}

// Sube imagenes nuevas a Cloudinary y registra sus filas en Supabase.
async function uploadImagesForProduct(productId: string, formData: FormData, userId: string) {
  const { supabase } = await requireAdmin();
  const files = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!files.length) {
    return;
  }

  const { count } = await supabase
    .from("producto_imagenes")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productId)
    .eq("activo", true);

  const hasImages = Boolean(count && count > 0);
  const selectedMainImageIndex = Number(getText(formData, "mainImageIndex"));
  const mainImageIndex =
    Number.isInteger(selectedMainImageIndex) &&
    selectedMainImageIndex >= 0 &&
    selectedMainImageIndex < files.length
      ? selectedMainImageIndex
      : hasImages
        ? -1
        : 0;
  const rows = [];

  if (hasImages && mainImageIndex >= 0) {
    await supabase
      .from("producto_imagenes")
      .update({ principal: false, actualizado_por: userId })
      .eq("producto_id", productId);
  }

  for (const [index, file] of files.entries()) {
    const result = await uploadProductImage(file);
    rows.push({
      producto_id: productId,
      cloudinary_public_id: result.public_id,
      cloudinary_secure_url: result.secure_url,
      cloudinary_url: result.url,
      cloudinary_version: result.version,
      cloudinary_signature: result.signature,
      cloudinary_format: result.format,
      cloudinary_resource_type: result.resource_type,
      cloudinary_width: result.width,
      cloudinary_height: result.height,
      cloudinary_bytes: result.bytes,
      alt: getText(formData, "imageAlt") || getText(formData, "name") || file.name,
      orden: (count ?? 0) + index,
      principal: index === mainImageIndex,
      activo: true,
      creado_por: userId,
      actualizado_por: userId,
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("producto_imagenes").insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }
}

type VariantInput = {
  id?: string;
  name?: string;
  description?: string;
  attributes?: Record<string, unknown>;
  image?: string;
  sku?: string;
  price?: number;
  offerPrice?: number | null;
  stock?: number;
  isActive?: boolean;
  sortOrder?: number;
};

function parseOfferPrice(
  value: number | string | null | undefined,
  regularPrice: number,
  label: string,
) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const offerPrice = Number(value);
  if (!Number.isFinite(offerPrice) || offerPrice <= 0 || offerPrice >= regularPrice) {
    throw new Error(`${label} debe ser mayor que cero y menor que el precio normal.`);
  }

  return offerPrice;
}

type ProductAttributeInput = {
  attributeId?: string;
  value?: string;
};

// Valida y reemplaza los atributos estructurados del producto. Nunca acepta
// atributos de otra categoría, aunque alguien manipule el formulario manualmente.
async function saveProductAttributes(
  productId: string,
  catalogNodeId: string | null,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const rawVariants = getText(formData, "variants");
  let submittedVariants: unknown = [];

  try {
    submittedVariants = rawVariants ? JSON.parse(rawVariants) : [];
  } catch {
    throw new Error("Las opciones del producto no tienen un formato válido.");
  }

  // Cuando existen opciones, sus atributos son la única fuente técnica del producto.
  if (Array.isArray(submittedVariants) && submittedVariants.length > 0) {
    const { error } = await supabase
      .from("producto_atributos")
      .delete()
      .eq("producto_id", productId);
    if (error) throw new Error(error.message);
    return;
  }

  const rawAttributes = getText(formData, "attributes");
  let submitted: ProductAttributeInput[] = [];

  try {
    submitted = rawAttributes ? JSON.parse(rawAttributes) : [];
  } catch {
    throw new Error("Las características del producto no tienen un formato válido.");
  }

  if (!Array.isArray(submitted)) {
    throw new Error("Las características del producto no tienen un formato válido.");
  }

  const [{ data: definitions, error: definitionsError }, { data: nodes, error: nodesError }] =
    await Promise.all([
      supabase
        .from("catalogo_atributos")
        .select("id, catalogo_nodo_id, obligatorio")
        .eq("activo", true),
      supabase.from("catalogo_nodos").select("id, parent_id"),
    ]);

  if (definitionsError || nodesError) {
    throw new Error(definitionsError?.message ?? nodesError?.message ?? "No se pudieron validar las características.");
  }

  const nodeById = new Map((nodes ?? []).map((node) => [node.id, node]));
  let rootNodeId = catalogNodeId;
  let current = catalogNodeId ? nodeById.get(catalogNodeId) : undefined;
  while (current?.parent_id) {
    current = nodeById.get(current.parent_id);
  }
  rootNodeId = current?.id ?? rootNodeId;

  const allowedDefinitions = (definitions ?? []).filter(
    (definition) => definition.catalogo_nodo_id === rootNodeId,
  );
  const allowedById = new Map(allowedDefinitions.map((definition) => [definition.id, definition]));
  const normalized = submitted.map((attribute) => ({
    attributeId: String(attribute.attributeId ?? "").trim(),
    value: String(attribute.value ?? "").trim(),
  }));

  if (
    normalized.some(
      (attribute) =>
        !attribute.attributeId ||
        !allowedById.has(attribute.attributeId) ||
        !attribute.value ||
        attribute.value.length > 120,
    )
  ) {
    throw new Error("Una característica no corresponde a la categoría seleccionada.");
  }

  const submittedIds = new Set(normalized.map((attribute) => attribute.attributeId));
  const missingRequired = allowedDefinitions.some(
    (definition) => definition.obligatorio && !submittedIds.has(definition.id),
  );
  if (missingRequired) {
    throw new Error("Completa las características requeridas para esta categoría.");
  }

  const { error: deleteError } = await supabase
    .from("producto_atributos")
    .delete()
    .eq("producto_id", productId);
  if (deleteError) throw new Error(deleteError.message);

  if (normalized.length) {
    const { error: insertError } = await supabase.from("producto_atributos").insert(
      normalized.map((attribute) => ({
        producto_id: productId,
        atributo_id: attribute.attributeId,
        valor: attribute.value,
      })),
    );
    if (insertError) throw new Error(insertError.message);
  }
}

async function saveProductVariants(productId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const rawVariants = getText(formData, "variants");
  let variants: VariantInput[] = [];

  try {
    variants = rawVariants ? JSON.parse(rawVariants) : [];
  } catch {
    throw new Error("Las opciones del producto no tienen un formato válido.");
  }

  if (!Array.isArray(variants)) {
    throw new Error("Las opciones del producto no tienen un formato válido.");
  }

  const normalized = variants.map((variant, index) => {
    const name = String(variant.name ?? "").trim();
    const price = Number(variant.price);
    const stock = Number(variant.stock);

    if (!name) throw new Error(`Completa el nombre de la opción ${index + 1}.`);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`El precio de la opción ${index + 1} no es válido.`);
    }
    const offerPrice = parseOfferPrice(
      variant.offerPrice,
      price,
      `El precio de oferta de la opciÃ³n ${index + 1}`,
    );
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(`El stock de la opción ${index + 1} no es válido.`);
    }

    return {
      id: String(variant.id ?? ""),
      producto_id: productId,
      nombre: name,
      descripcion: String(variant.description ?? "").trim() || null,
      atributos: Object.fromEntries(
        Object.entries(variant.attributes ?? {}).flatMap(([key, value]) => {
          const normalizedValue = typeof value === "string" ? value.trim() : "";
          return normalizedValue ? [[key, normalizedValue]] : [];
        }),
      ),
      imagen: String(variant.image ?? "").trim() || null,
      sku: String(variant.sku ?? "").trim() || null,
      precio: price,
      precio_oferta: offerPrice,
      stock,
      activo: variant.isActive !== false,
      orden: index + 1,
    };
  });
  const existingRows = normalized.filter((variant) => !variant.id.startsWith("new-"));
  const newRows = normalized.filter((variant) => variant.id.startsWith("new-"));
  const submittedExistingIds = existingRows.map((variant) => variant.id);

  const { data: storedVariants, error: storedError } = await supabase
    .from("producto_variantes")
    .select("id")
    .eq("producto_id", productId);

  if (storedError) throw new Error(storedError.message);

  const storedIds = (storedVariants ?? []).map((variant) => variant.id);
  const removedIds = storedIds.filter((id) => !submittedExistingIds.includes(id));

  if (removedIds.length) {
    const { error } = await supabase
      .from("producto_variantes")
      .update({ activo: false })
      .eq("producto_id", productId)
      .in("id", removedIds);
    if (error) throw new Error(error.message);
  }

  for (const variant of existingRows) {
    const { id, ...payload } = variant;
    const { error } = await supabase
      .from("producto_variantes")
      .update(payload)
      .eq("id", id)
      .eq("producto_id", productId);
    if (error) throw new Error(error.message);
  }

  if (newRows.length) {
    const { error } = await supabase.from("producto_variantes").insert(
      newRows.map((variant) => ({
        producto_id: variant.producto_id,
        nombre: variant.nombre,
        descripcion: variant.descripcion,
        atributos: variant.atributos,
        imagen: variant.imagen,
        sku: variant.sku,
        precio: variant.precio,
        precio_oferta: variant.precio_oferta,
        stock: variant.stock,
        activo: variant.activo,
        orden: variant.orden,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

// Crea o actualiza un producto completo desde el formulario admin.
export async function saveProduct(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const relations = await resolveFlexibleProductRelations(formData);
  const productId = getText(formData, "productId");
  const features = getText(formData, "features")
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
  const price = Number(getText(formData, "price"));
  const stock = Number(getText(formData, "stock"));
  const rawVariants = getText(formData, "variants");
  let submittedVariants: unknown = [];

  try {
    submittedVariants = rawVariants ? JSON.parse(rawVariants) : [];
  } catch {
    throw new Error("Las opciones del producto no tienen un formato vÃ¡lido.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("El precio del producto no es vÃ¡lido.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("El stock del producto no es vÃ¡lido.");
  }

  const hasVariants = Array.isArray(submittedVariants) && submittedVariants.length > 0;
  const offerPrice = hasVariants
    ? null
    : parseOfferPrice(getText(formData, "offerPrice"), price, "El precio de oferta");

  const payload = {
    categoria_id: relations.categoryId,
    subcategoria_id: relations.subcategoryId,
    marca_id: relations.brandId,
    slug: getText(formData, "slug"),
    nombre: getText(formData, "name"),
    sku: getText(formData, "sku"),
    precio: price,
    precio_oferta: offerPrice,
    stock,
    descripcion: getText(formData, "description"),
    caracteristicas: features,
    youtube_video_id: getYouTubeVideoId(getText(formData, "youtubeVideoId")),
    destacado: formData.get("isFeatured") === "on",
    activo: formData.get("isActive") === "on",
    actualizado_por: userId,
  };
  const flexiblePayload = relations.catalogNodeId
    ? { ...payload, catalogo_nodo_id: relations.catalogNodeId }
    : payload;

  if (productId) {
    const { error } = await supabase.from("productos").update(flexiblePayload).eq("id", productId);
    if (error) {
      throw new Error(error.message);
    }
    await uploadImagesForProduct(productId, formData, userId);
    await saveProductVariants(productId, formData);
    await saveProductAttributes(productId, relations.catalogNodeId, formData);
  } else {
    const { data, error } = await supabase
      .from("productos")
      .insert({ ...flexiblePayload, creado_por: userId })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo crear el producto.");
    }

    await uploadImagesForProduct(data.id, formData, userId);
    await saveProductVariants(data.id, formData);
    await saveProductAttributes(data.id, relations.catalogNodeId, formData);
  }

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

// Activa o desactiva un producto sin eliminarlo.
export async function toggleProductActive(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const id = getText(formData, "id");
  const active = getText(formData, "active") === "true";

  await supabase
    .from("productos")
    .update({ activo: !active, actualizado_por: userId })
    .eq("id", id);

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
}

// Desactiva un producto para ocultarlo del catalogo.
export async function deleteProduct(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const id = getText(formData, "id");

  await supabase
    .from("productos")
    .update({ activo: false, actualizado_por: userId })
    .eq("id", id);

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
}

// Marca una imagen existente como principal.
export async function setMainImage(productId: string, imageId: string) {
  const { supabase, userId } = await requireAdmin();

  await supabase
    .from("producto_imagenes")
    .update({ principal: false, actualizado_por: userId })
    .eq("producto_id", productId);
  await supabase
    .from("producto_imagenes")
    .update({ principal: true, actualizado_por: userId })
    .eq("id", imageId)
    .eq("producto_id", productId);

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}/editar`);
}

// Desactiva una imagen de producto y limpia Cloudinary si corresponde.
export async function deleteProductImage(productId: string, imageId: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: image, error: imageError } = await supabase
    .from("producto_imagenes")
    .select("id, principal")
    .eq("id", imageId)
    .eq("producto_id", productId)
    .maybeSingle();

  if (imageError) {
    throw new Error(imageError.message);
  }

  if (!image) {
    throw new Error("Imagen no encontrada.");
  }

  const { error } = await supabase
    .from("producto_imagenes")
    .update({ activo: false, principal: false, actualizado_por: userId })
    .eq("id", imageId);

  if (error) {
    throw new Error(error.message);
  }

  if (image.principal) {
    const { data: nextImage } = await supabase
      .from("producto_imagenes")
      .select("id")
      .eq("producto_id", productId)
      .eq("activo", true)
      .order("orden", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImage) {
      await supabase
        .from("producto_imagenes")
        .update({ principal: true, actualizado_por: userId })
        .eq("id", nextImage.id);
    }
  }

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}/editar`);
}
