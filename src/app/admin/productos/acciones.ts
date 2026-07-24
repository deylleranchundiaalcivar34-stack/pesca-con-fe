"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { deleteCloudinaryImage, uploadProductImage } from "@/lib/cloudinary";
import {
  MAX_PRODUCT_IMAGE_DIMENSION,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES,
  validateProductImageFiles,
} from "@/lib/seguridad-imagenes";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  PublicServerError,
  publicServerError,
  reportServerError,
} from "@/lib/safe-server-error";
import {
  MAX_PRODUCT_BASE_OPTION_NAME_LENGTH,
} from "@/lib/opciones-producto";

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProductActionState = {
  status: "idle" | "error";
  message: string;
};

export type PermanentProductDeleteResult = {
  status: "success" | "warning" | "error";
  message: string;
};

type PermanentProductDeleteRpcResult = {
  status?: unknown;
  cloudinary_public_ids?: unknown;
};

class ProductFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductFormError";
  }
}

// Lee un campo de formulario como texto limpio.
function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function requireTextLength(value: string, label: string, maximum: number) {
  if ([...value].length > maximum) {
    throw new ProductFormError(`${label} supera el máximo de ${maximum} caracteres.`);
  }
  return value;
}

function requireUuid(value: string, label: string) {
  if (!UUID_PATTERN.test(value)) throw new ProductFormError(`${label} no válido.`);
  return value;
}

// Invalida cache publica despues de cambios que afectan la tienda.
function revalidatePublicProducts() {
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[...slug]", "page");
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

// Resuelve la ruta flexible del catalogo y conserva columnas antiguas cuando existen.
async function resolveFlexibleProductRelations(
  supabase: AdminClient,
  formData: FormData,
  productId: string,
) {
  const brandName = getText(formData, "brand");
  const catalogNodeIdInput = getText(formData, "catalogNodeId");
  const catalogNodeId = catalogNodeIdInput.startsWith("fallback-")
    ? ""
    : catalogNodeIdInput;
  let categorySlug = getText(formData, "categorySlug");
  let subcategorySlug = getText(formData, "subcategorySlug");
  let catalogPathSlugs: string[] = [];

  if (catalogNodeId) {
    const { data: nodes, error: nodesError } = await supabase
      .from("catalogo_nodos")
      .select("id, parent_id, slug")
      .eq("activo", true);

    if (nodesError) throw publicServerError("Catalog node validation failed", nodesError, "No se pudo validar el catálogo.");

    const nodeById = new Map((nodes ?? []).map((node) => [node.id, node]));

    if (!nodeById.has(catalogNodeId)) {
      throw new ProductFormError("La categoría seleccionada ya no está disponible.");
    }
    const path = [];
    let current = nodeById.get(catalogNodeId);

    while (current) {
      path.unshift(current);
      current = current.parent_id ? nodeById.get(current.parent_id) : undefined;
    }

    categorySlug = path[0]?.slug ?? categorySlug;
    subcategorySlug = path[1]?.slug ?? subcategorySlug;
    catalogPathSlugs = path.map((node) => node.slug);
  }

  const [brandResult, categoryResult] = await Promise.all([
    supabase.from("marcas").select("id, activa").eq("nombre", brandName).maybeSingle(),
    supabase.from("categorias").select("id").eq("slug", categorySlug).maybeSingle(),
  ]);
  const { data: brand, error: brandError } = brandResult;
  const { data: category, error: categoryError } = categoryResult;

  if (brandError || categoryError) {
    throw publicServerError("Catalog relation validation failed", brandError ?? categoryError, "No se pudo validar el catálogo.");
  }

  if (!catalogNodeId || !category || !brand) {
    throw new ProductFormError("Selecciona una categoría y una marca válidas.");
  }

  if (!brand.activa) {
    if (!productId) {
      throw new ProductFormError("La marca seleccionada ya no está disponible.");
    }

    const { data: currentProduct, error: currentProductError } = await supabase
      .from("productos")
      .select("marca_id")
      .eq("id", productId)
      .maybeSingle();

    if (currentProductError) {
      throw publicServerError(
        "Inactive product brand validation failed",
        currentProductError,
        "No se pudo validar la marca actual.",
      );
    }
    if (currentProduct?.marca_id !== brand.id) {
      throw new ProductFormError("La marca seleccionada ya no está disponible.");
    }
  }

  const { data: subcategory, error: subcategoryError } = await supabase
    .from("subcategorias")
    .select("id")
    .eq("categoria_id", category.id)
    .eq("slug", subcategorySlug)
    .maybeSingle();

  if (subcategoryError) throw publicServerError("Subcategory validation failed", subcategoryError, "No se pudo validar la subcategoría.");

  return {
    brandId: brand?.id ?? null,
    categoryId: category?.id ?? null,
    subcategoryId: subcategory?.id ?? null,
    catalogNodeId: catalogNodeId || null,
    categorySlug,
    isCurrican: catalogPathSlugs.includes("curricanes"),
  };
}

type PreparedProductImages = {
  files: File[];
  existingImages: Array<{ id: string; principal: boolean }>;
};

function getNewImageColors(formData: FormData, imageCount: number) {
  const rawColors = getText(formData, "newImageColors");
  if (!rawColors) return Array.from({ length: imageCount }, () => "");

  let colors: unknown;
  try {
    colors = JSON.parse(rawColors);
  } catch {
    throw new ProductFormError("Los colores de las imágenes no tienen un formato válido.");
  }

  if (!Array.isArray(colors) || colors.length !== imageCount) {
    throw new ProductFormError("Los colores de las imágenes no coinciden con los archivos seleccionados.");
  }

  return colors.map((color, index) =>
    requireTextLength(String(color ?? "").trim(), `El color de la imagen ${index + 1}`, 80),
  );
}

function getNewImageVariantIds(formData: FormData, imageCount: number) {
  const rawVariantIds = getText(formData, "newImageVariantIds");
  if (!rawVariantIds) return Array.from({ length: imageCount }, () => "");

  let variantIds: unknown;
  try {
    variantIds = JSON.parse(rawVariantIds);
  } catch {
    throw new ProductFormError("Las variantes de las imágenes no tienen un formato válido.");
  }

  if (!Array.isArray(variantIds) || variantIds.length !== imageCount) {
    throw new ProductFormError("Las variantes de las imágenes no coinciden con los archivos seleccionados.");
  }

  return variantIds.map((variantId, index) => {
    const value = String(variantId ?? "").trim().replace(/^new-/, "");
    if (value && !UUID_PATTERN.test(value)) {
      throw new ProductFormError(`La variante de la imagen ${index + 1} no es válida.`);
    }
    return value;
  });
}

// Ejecuta todas las validaciones locales de las imágenes antes de modificar el
// producto, evitando que un envío inválido deje cambios parciales.
async function prepareProductImages(
  supabase: AdminClient,
  productId: string | null,
  formData: FormData,
): Promise<PreparedProductImages> {
  const files = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!files.length) {
    return { files, existingImages: [] };
  }

  try {
    await validateProductImageFiles(files);
  } catch (error) {
    throw new ProductFormError(
      error instanceof Error ? error.message : "No se pudieron validar las imágenes.",
    );
  }

  if (!productId) {
    return { files, existingImages: [] };
  }

  const { data: existingImages, error: existingImagesError } = await supabase
    .from("producto_imagenes")
    .select("id, principal")
    .eq("producto_id", productId)
    .eq("activo", true);

  if (existingImagesError) {
    throw publicServerError("Product image lookup failed", existingImagesError, "No se pudieron validar las imágenes.");
  }

  if ((existingImages?.length ?? 0) + files.length > MAX_PRODUCT_IMAGES) {
    throw new ProductFormError(
      `Un producto puede conservar como máximo ${MAX_PRODUCT_IMAGES} imágenes.`,
    );
  }

  return { files, existingImages: existingImages ?? [] };
}

// Sube imágenes ya validadas a Cloudinary y registra sus filas en Supabase.
async function uploadImagesForProduct(
  supabase: AdminClient,
  productId: string,
  formData: FormData,
  userId: string,
  preparedImages: PreparedProductImages,
) {
  const { files, existingImages } = preparedImages;

  if (!files.length) {
    return;
  }

  const hasImages = existingImages.length > 0;
  const previousMainImageId = existingImages.find((image) => image.principal)?.id;
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
  const imageColors = getNewImageColors(formData, files.length);
  const imageVariantIds = getNewImageVariantIds(formData, files.length);
  const uploadedPublicIds: string[] = [];

  try {
    const submittedVariantIds = Array.from(
      new Set(imageVariantIds.filter((variantId) => Boolean(variantId))),
    );
    if (submittedVariantIds.length) {
      const { data: matchingVariants, error: matchingVariantsError } = await supabase
        .from("producto_variantes")
        .select("id")
        .eq("producto_id", productId)
        .in("id", submittedVariantIds);

      if (matchingVariantsError) {
        throw publicServerError(
          "Product image variant validation failed",
          matchingVariantsError,
          "No se pudieron validar los colores de las imágenes.",
        );
      }
      if ((matchingVariants?.length ?? 0) !== submittedVariantIds.length) {
        throw new ProductFormError("Una imagen está vinculada a un color que no pertenece al producto.");
      }
    }

    for (const [index, file] of files.entries()) {
      const result = await uploadProductImage(file);
      uploadedPublicIds.push(result.public_id);
      if (
        result.resource_type !== "image" ||
        result.bytes > MAX_PRODUCT_IMAGE_BYTES ||
        result.width > MAX_PRODUCT_IMAGE_DIMENSION ||
        result.height > MAX_PRODUCT_IMAGE_DIMENSION
      ) {
        throw new ProductFormError("Cloudinary rechazó una imagen por tamaño o dimensiones.");
      }
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
        color: imageColors[index] || null,
        variante_id: imageVariantIds[index] || null,
        orden: existingImages.length + index,
        principal: index === mainImageIndex,
        activo: true,
        creado_por: userId,
        actualizado_por: userId,
      });
    }

    if (hasImages && mainImageIndex >= 0) {
      const { error } = await supabase
        .from("producto_imagenes")
        .update({ principal: false, actualizado_por: userId })
        .eq("producto_id", productId)
        .eq("activo", true);

      if (error) throw publicServerError("Product main image reset failed", error, "No se pudo preparar la imagen principal.");
    }

    const { error } = await supabase.from("producto_imagenes").insert(rows);
    if (error) throw publicServerError("Product image insert failed", error, "No se pudieron guardar las imágenes.");
  } catch (error) {
    if (previousMainImageId && mainImageIndex >= 0) {
      await supabase
        .from("producto_imagenes")
        .update({ principal: true, actualizado_por: userId })
        .eq("id", previousMainImageId);
    }

    await Promise.allSettled(uploadedPublicIds.map((publicId) => deleteCloudinaryImage(publicId)));
    throw error;
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
  additionalPrice?: number;
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
    throw new ProductFormError(`${label} debe ser mayor que cero y menor que el precio normal.`);
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
  supabase: AdminClient,
  productId: string,
  catalogNodeId: string | null,
  formData: FormData,
  retainProductAttributes = false,
) {
  const rawVariants = getText(formData, "variants");
  let submittedVariants: unknown = [];

  try {
    submittedVariants = rawVariants ? JSON.parse(rawVariants) : [];
  } catch {
    throw new ProductFormError("Las opciones del producto no tienen un formato válido.");
  }

  // Cuando existen opciones, sus atributos son la única fuente técnica del producto.
  if (Array.isArray(submittedVariants) && submittedVariants.length > 0 && !retainProductAttributes) {
    const { error } = await supabase
      .from("producto_atributos")
      .delete()
      .eq("producto_id", productId);
    if (error) throw publicServerError("Product attributes lookup failed", error, "No se pudieron validar las características.");
    return;
  }

  const rawAttributes = getText(formData, "attributes");
  let submitted: ProductAttributeInput[] = [];

  try {
    submitted = rawAttributes ? JSON.parse(rawAttributes) : [];
  } catch {
    throw new ProductFormError("Las características del producto no tienen un formato válido.");
  }

  if (!Array.isArray(submitted)) {
    throw new ProductFormError("Las características del producto no tienen un formato válido.");
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
    throw publicServerError("Product attribute definitions failed", definitionsError ?? nodesError, "No se pudieron validar las características.");
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
    throw new ProductFormError("Una característica no corresponde a la categoría seleccionada.");
  }

  const submittedIds = new Set(normalized.map((attribute) => attribute.attributeId));
  const missingRequired = allowedDefinitions.some(
    (definition) => definition.obligatorio && !submittedIds.has(definition.id),
  );
  if (missingRequired) {
    throw new ProductFormError("Completa las características requeridas para esta categoría.");
  }

  const { error: deleteError } = await supabase
    .from("producto_atributos")
    .delete()
    .eq("producto_id", productId);
  if (deleteError) throw publicServerError("Product attributes replace failed", deleteError, "No se pudieron actualizar las características.");

  if (normalized.length) {
    const { error: insertError } = await supabase.from("producto_atributos").insert(
      normalized.map((attribute) => ({
        producto_id: productId,
        atributo_id: attribute.attributeId,
        valor: attribute.value,
      })),
    );
    if (insertError) throw publicServerError("Product attributes insert failed", insertError, "No se pudieron guardar las características.");
  }
}

async function saveProductVariants(
  supabase: AdminClient,
  productId: string,
  formData: FormData,
  pricing: {
    basePrice: number;
    baseOfferPrice: number | null;
    usesAdditionalPrice: boolean;
    usesColorVariants: boolean;
  },
) {
  const rawVariants = getText(formData, "variants");
  let variants: VariantInput[] = [];

  try {
    variants = rawVariants ? JSON.parse(rawVariants) : [];
  } catch {
    throw new ProductFormError("Las opciones del producto no tienen un formato válido.");
  }

  if (!Array.isArray(variants)) {
    throw new ProductFormError("Las opciones del producto no tienen un formato válido.");
  }

  if (variants.length > 100) {
    throw new ProductFormError("Un producto no puede tener más de cien opciones.");
  }

  const normalized = variants.map((variant, index) => {
    const name = requireTextLength(
      String(variant.name ?? "").trim(),
      `El nombre de la opción ${index + 1}`,
      160,
    );
    const variantDescription = requireTextLength(
      String(variant.description ?? "").trim(),
      `La descripción de la opción ${index + 1}`,
      1_000,
    );
    const variantImage = requireTextLength(
      String(variant.image ?? "").trim(),
      `La imagen de la opción ${index + 1}`,
      2_048,
    );
    const variantSku = requireTextLength(
      String(variant.sku ?? "").trim(),
      `El SKU de la opción ${index + 1}`,
      80,
    );
    const attributeEntries = Object.entries(variant.attributes ?? {});
    const additionalPrice = Number(variant.additionalPrice ?? 0);
    const price = pricing.usesAdditionalPrice
      ? pricing.basePrice + additionalPrice
      : Number(variant.price);
    const stock = Number(variant.stock);

    if (!name) throw new ProductFormError(`Completa el nombre de la opción ${index + 1}.`);
    if (pricing.usesColorVariants && !variantSku) {
      throw new ProductFormError(`Completa el SKU del color ${index + 1}.`);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new ProductFormError(`El precio de la opción ${index + 1} no es válido.`);
    }
    if (!Number.isFinite(additionalPrice) || additionalPrice < 0) {
      throw new ProductFormError(`El cargo adicional de la opción ${index + 1} no es válido.`);
    }
    const offerPrice = pricing.usesAdditionalPrice
      ? pricing.baseOfferPrice === null ? null : pricing.baseOfferPrice + additionalPrice
      : parseOfferPrice(
          variant.offerPrice,
          price,
          `El precio de oferta de la opción ${index + 1}`,
        );
    if (!Number.isInteger(stock) || stock < 0) {
      throw new ProductFormError(`El stock de la opción ${index + 1} no es válido.`);
    }

    const id = String(variant.id ?? "").trim().replace(/^new-/, "");

    if (!UUID_PATTERN.test(id)) {
      throw new ProductFormError(`El identificador de la opción ${index + 1} no es válido.`);
    }
    if (attributeEntries.length > 20) {
      throw new ProductFormError(`La opción ${index + 1} contiene demasiados atributos.`);
    }

    const normalizedAttributes = Object.fromEntries(
      attributeEntries.flatMap(([key, value]) => {
        const normalizedKey = String(key).trim();
        const normalizedValue = typeof value === "string" ? value.trim() : "";
        if (!/^[a-z0-9_-]{1,60}$/i.test(normalizedKey)) {
          throw new ProductFormError(`La opción ${index + 1} contiene un atributo no válido.`);
        }
        requireTextLength(
          normalizedValue,
          `Un atributo de la opción ${index + 1}`,
          200,
        );
        return normalizedValue ? [[normalizedKey, normalizedValue]] : [];
      }),
    );
    if (pricing.usesColorVariants && !String(normalizedAttributes.color ?? "").trim()) {
      throw new ProductFormError(`Completa el nombre del color ${index + 1}.`);
    }

    return {
      id,
      producto_id: productId,
      nombre: name,
      descripcion: variantDescription || null,
      atributos: normalizedAttributes,
      imagen: variantImage || null,
      sku: variantSku || null,
      precio: price,
      precio_oferta: offerPrice,
      precio_adicional: pricing.usesAdditionalPrice ? additionalPrice : null,
      stock,
      activo: variant.isActive !== false,
      orden: index + 1,
    };
  });
  const { data: storedVariants, error: storedError } = await supabase
    .from("producto_variantes")
    .select("id")
    .eq("producto_id", productId);

  if (storedError) throw publicServerError("Product variants lookup failed", storedError, "No se pudieron validar las variantes.");

  const storedIds = (storedVariants ?? []).map((variant) => variant.id);
  const storedIdSet = new Set(storedIds);
  const existingRows = normalized.filter((variant) => storedIdSet.has(variant.id));
  const newRows = normalized.filter((variant) => !storedIdSet.has(variant.id));
  const submittedExistingIds = existingRows.map((variant) => variant.id);
  const removedIds = storedIds.filter((id) => !submittedExistingIds.includes(id));

  if (removedIds.length) {
    const { error } = await supabase
      .from("producto_variantes")
      .update({ activo: false })
      .eq("producto_id", productId)
      .in("id", removedIds);
    if (error) throw publicServerError("Product variants deactivate failed", error, "No se pudieron actualizar las variantes.");
  }

  for (const variant of existingRows) {
    const { id, ...payload } = variant;
    const { error } = await supabase
      .from("producto_variantes")
      .update(payload)
      .eq("id", id)
      .eq("producto_id", productId);
    if (error) throw publicServerError("Product variant update failed", error, "No se pudo actualizar una variante.");
  }

  if (newRows.length) {
    const { error } = await supabase.from("producto_variantes").insert(
      newRows.map((variant) => ({
        id: variant.id,
        producto_id: variant.producto_id,
        nombre: variant.nombre,
        descripcion: variant.descripcion,
        atributos: variant.atributos,
        imagen: variant.imagen,
        sku: variant.sku,
        precio: variant.precio,
        precio_oferta: variant.precio_oferta,
        precio_adicional: variant.precio_adicional,
        stock: variant.stock,
        activo: variant.activo,
        orden: variant.orden,
      })),
    );
    if (error) throw publicServerError("Product variants insert failed", error, "No se pudieron crear las variantes.");
  }
}

// Crea o actualiza un producto completo. Los errores esperados se convierten
// en estado de formulario en la acción pública que aparece más abajo.
async function persistProduct(formData: FormData) {
  const { supabase, userId } = await requireAdmin("catalog.write");
  const productId = getText(formData, "productId");
  const name = getText(formData, "name");
  const slug = getText(formData, "slug");
  const sku = getText(formData, "sku");
  const description = getText(formData, "description");

  if (productId) requireUuid(productId, "Producto");
  if (!name || !slug || !sku || !description) {
    throw new ProductFormError("Completa nombre, slug, SKU y descripción del producto.");
  }
  requireTextLength(name, "El nombre", 160);
  requireTextLength(slug, "El slug", 180);
  requireTextLength(sku, "El SKU", 80);
  requireTextLength(description, "La descripción", 5_000);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ProductFormError("El slug del producto no es válido.");
  }

  const relations = await resolveFlexibleProductRelations(supabase, formData, productId);
  const baseOptionNameInput = getText(formData, "baseOptionName");
  const baseOptionName = relations.isCurrican
    ? requireTextLength(
        baseOptionNameInput,
        "El nombre de la opción base",
        MAX_PRODUCT_BASE_OPTION_NAME_LENGTH,
      )
    : null;
  if (relations.isCurrican && !baseOptionName) {
    throw new ProductFormError("Completa el nombre de la opción base.");
  }
  const features = getText(formData, "features")
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
  if (features.length > 30) {
    throw new ProductFormError("Un producto no puede tener más de treinta características.");
  }
  features.forEach((feature) => requireTextLength(feature, "Una característica", 300));
  let price = Number(getText(formData, "price"));
  let stock = Number(getText(formData, "stock"));
  const rawVariants = getText(formData, "variants");
  let submittedVariants: unknown = [];

  try {
    submittedVariants = rawVariants ? JSON.parse(rawVariants) : [];
  } catch {
    throw new ProductFormError("Las opciones del producto no tienen un formato válido.");
  }

  const hasVariants = Array.isArray(submittedVariants) && submittedVariants.length > 0;
  const usesCurricanPricing = relations.isCurrican;
  const usesColorVariants = relations.categorySlug === "senuelos" && !relations.isCurrican;

  if (usesColorVariants) {
    if (!Array.isArray(submittedVariants) || !submittedVariants.length) {
      throw new ProductFormError("Agrega por lo menos un color con su SKU, precio y stock.");
    }

    const colorVariants = submittedVariants as VariantInput[];
    const activeColorVariants = colorVariants.filter((variant) => variant.isActive !== false);
    const priceSources = activeColorVariants.length ? activeColorVariants : colorVariants;
    const prices = priceSources.map((variant) => Number(variant.price));
    const stocks = activeColorVariants.map((variant) => Number(variant.stock));

    if (prices.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new ProductFormError("El precio de uno de los colores no es válido.");
    }
    if (stocks.some((value) => !Number.isInteger(value) || value < 0)) {
      throw new ProductFormError("El stock de uno de los colores no es válido.");
    }

    price = Math.min(...prices);
    stock = stocks.reduce((total, value) => total + value, 0);
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new ProductFormError("El precio del producto no es válido.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ProductFormError("El stock del producto no es válido.");
  }

  const offerPrice = hasVariants && !usesCurricanPricing
    ? null
    : parseOfferPrice(getText(formData, "offerPrice"), price, "El precio de oferta");
  const preparedImages = await prepareProductImages(
    supabase,
    productId || null,
    formData,
  );

  const payload = {
    categoria_id: relations.categoryId,
    subcategoria_id: relations.subcategoryId,
    marca_id: relations.brandId,
    slug,
    nombre: name,
    sku,
    precio: price,
    precio_oferta: offerPrice,
    nombre_opcion_base: baseOptionName,
    stock,
    descripcion: description,
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
    const { data, error } = await supabase
      .from("productos")
      .update(flexiblePayload)
      .eq("id", productId)
      .select("id")
      .maybeSingle();
    if (error || !data) throw publicServerError("Product update failed", error, "No se pudo actualizar el producto.");
    await saveProductVariants(supabase, productId, formData, {
      basePrice: price,
      baseOfferPrice: offerPrice,
      usesAdditionalPrice: usesCurricanPricing,
      usesColorVariants,
    });
    await uploadImagesForProduct(supabase, productId, formData, userId, preparedImages);
    await saveProductAttributes(
      supabase,
      productId,
      relations.catalogNodeId,
      formData,
      usesCurricanPricing || usesColorVariants,
    );
  } else {
    const { data, error } = await supabase
      .from("productos")
      .insert({ ...flexiblePayload, creado_por: userId })
      .select("id")
      .single();

    if (error || !data) {
      throw publicServerError("Product creation failed", error, "No se pudo crear el producto.");
    }

    await saveProductVariants(supabase, data.id, formData, {
      basePrice: price,
      baseOfferPrice: offerPrice,
      usesAdditionalPrice: usesCurricanPricing,
      usesColorVariants,
    });
    await uploadImagesForProduct(supabase, data.id, formData, userId, preparedImages);
    await saveProductAttributes(
      supabase,
      data.id,
      relations.catalogNodeId,
      formData,
      usesCurricanPricing || usesColorVariants,
    );
  }

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
}

// Los rechazos normales del formulario vuelven a la misma pantalla. Solo los
// fallos inesperados se registran con una referencia segura.
export async function saveProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    await persistProduct(formData);
  } catch (error) {
    if (error instanceof ProductFormError || error instanceof PublicServerError) {
      return { status: "error", message: error.message };
    }

    const correlationId = reportServerError("Unexpected product save failure", error);
    return {
      status: "error",
      message: `No se pudo guardar el producto. Intenta nuevamente. Referencia: ${correlationId}`,
    };
  }

  redirect("/admin/productos");
}

// Activa o desactiva un producto sin eliminarlo.
export async function toggleProductActive(formData: FormData) {
  const { supabase, userId } = await requireAdmin("catalog.write");
  const id = requireUuid(getText(formData, "id"), "Producto");
  const active = getText(formData, "active") === "true";

  const { data, error } = await supabase
    .from("productos")
    .update({ activo: !active, actualizado_por: userId })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw publicServerError("Product active state update failed", error, "No se pudo actualizar el producto.");

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
}

// Elimina un producto inactivo solo si no forma parte del historial comercial.
export async function deleteProductPermanently(
  formData: FormData,
): Promise<PermanentProductDeleteResult> {
  try {
    const { supabase } = await requireAdmin("catalog.write");
    const id = requireUuid(getText(formData, "id"), "Producto");

    const { data, error } = await supabase.rpc("eliminar_producto_inactivo", {
      producto_id_input: id,
    });

    if (error) {
      throw publicServerError(
        "Permanent product delete failed",
        error,
        "No se pudo eliminar el producto.",
      );
    }

    const result =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as PermanentProductDeleteRpcResult)
        : {};

    if (result.status === "not_found") {
      return { status: "error", message: "El producto ya no existe." };
    }

    if (result.status === "active") {
      return {
        status: "error",
        message: "Desactiva el producto antes de eliminarlo definitivamente.",
      };
    }

    if (result.status === "active_reservation") {
      return {
        status: "error",
        message: "El producto tiene una reserva de stock vigente. Intenta nuevamente cuando finalice.",
      };
    }

    if (result.status === "order_history") {
      return {
        status: "error",
        message: "No se puede eliminar porque aparece en pedidos. Puedes mantenerlo inactivo.",
      };
    }

    if (result.status === "sale_history") {
      return {
        status: "error",
        message: "No se puede eliminar porque aparece en ventas físicas. Puedes mantenerlo inactivo.",
      };
    }

    if (result.status !== "deleted") {
      throw publicServerError(
        "Permanent product delete returned an invalid result",
        result,
        "No se pudo confirmar la eliminación del producto.",
      );
    }

    const publicIds = Array.isArray(result.cloudinary_public_ids)
      ? result.cloudinary_public_ids.filter(
          (publicId): publicId is string =>
            typeof publicId === "string" && publicId.length > 0,
        )
      : [];
    const cleanupResults = await Promise.allSettled(
      publicIds.map((publicId) => deleteCloudinaryImage(publicId)),
    );
    const cleanupFailure = cleanupResults.find(
      (cleanupResult) => cleanupResult.status === "rejected",
    );

    revalidatePublicProducts();
    revalidatePath("/admin/productos");

    if (cleanupFailure?.status === "rejected") {
      reportServerError(
        "Cloudinary cleanup after permanent product delete failed",
        cleanupFailure.reason,
      );
      return {
        status: "warning",
        message: "Producto eliminado. Algunas imágenes no pudieron limpiarse de Cloudinary.",
      };
    }

    return { status: "success", message: "Producto eliminado definitivamente." };
  } catch (error) {
    if (error instanceof ProductFormError || error instanceof PublicServerError) {
      return { status: "error", message: error.message };
    }

    const correlationId = reportServerError(
      "Unexpected permanent product delete failure",
      error,
    );
    return {
      status: "error",
      message: `No se pudo eliminar el producto. Intenta nuevamente. Referencia: ${correlationId}`,
    };
  }
}

// Marca una imagen existente como principal.
export async function setMainImage(productId: string, imageId: string) {
  const { supabase, userId } = await requireAdmin("catalog.write");
  requireUuid(productId, "Producto");
  requireUuid(imageId, "Imagen");

  const { data: target, error: targetError } = await supabase
    .from("producto_imagenes")
    .select("id, principal")
    .eq("id", imageId)
    .eq("producto_id", productId)
    .eq("activo", true)
    .maybeSingle();

  if (targetError || !target) {
    throw publicServerError("Product image target lookup failed", targetError, "No se pudo validar la imagen.");
  }

  if (target.principal) return;

  const { data: previousMain, error: previousMainError } = await supabase
    .from("producto_imagenes")
    .select("id")
    .eq("producto_id", productId)
    .eq("activo", true)
    .eq("principal", true)
    .maybeSingle();

  if (previousMainError) throw publicServerError("Previous main image lookup failed", previousMainError, "No se pudo validar la imagen principal.");

  const { error: clearError } = await supabase
    .from("producto_imagenes")
    .update({ principal: false, actualizado_por: userId })
    .eq("producto_id", productId)
    .eq("activo", true);

  if (clearError) throw publicServerError("Main image clear failed", clearError, "No se pudo actualizar la imagen principal.");

  const { data: updated, error: updateError } = await supabase
    .from("producto_imagenes")
    .update({ principal: true, actualizado_por: userId })
    .eq("id", imageId)
    .eq("producto_id", productId)
    .eq("activo", true)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    if (previousMain) {
      await supabase
        .from("producto_imagenes")
        .update({ principal: true, actualizado_por: userId })
        .eq("id", previousMain.id);
    }

    throw publicServerError("Main image promotion failed", updateError, "No se pudo actualizar la imagen principal.");
  }

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}/editar`);
}

// Guarda la etiqueta de color de una imagen para los señuelos con presentaciones por color.
export async function setProductImageColor(productId: string, imageId: string, color: string) {
  const { supabase, userId } = await requireAdmin("catalog.write");
  requireUuid(productId, "Producto");
  requireUuid(imageId, "Imagen");
  const normalizedColor = requireTextLength(color.trim(), "El color", 80);

  const { data, error } = await supabase
    .from("producto_imagenes")
    .update({ color: normalizedColor || null, actualizado_por: userId })
    .eq("id", imageId)
    .eq("producto_id", productId)
    .eq("activo", true)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw publicServerError("Product image color update failed", error, "No se pudo actualizar el color de la imagen.");
  }

  revalidatePublicProducts();
  revalidatePath(`/admin/productos/${productId}/editar`);
}

// Relaciona una imagen existente con la variante de color del mismo producto.
export async function setProductImageVariant(
  productId: string,
  imageId: string,
  variantId: string | null,
) {
  const { supabase, userId } = await requireAdmin("catalog.write");
  requireUuid(productId, "Producto");
  requireUuid(imageId, "Imagen");

  let color: string | null = null;
  if (variantId) {
    requireUuid(variantId, "Color");
    const { data: variant, error: variantError } = await supabase
      .from("producto_variantes")
      .select("id, nombre, atributos")
      .eq("id", variantId)
      .eq("producto_id", productId)
      .maybeSingle();

    if (variantError || !variant) {
      throw publicServerError(
        "Product image variant lookup failed",
        variantError,
        "No se pudo validar el color seleccionado.",
      );
    }

    const attributes = variant.atributos as Record<string, unknown> | null;
    color = String(attributes?.color ?? variant.nombre).trim() || null;
  }

  const { data, error } = await supabase
    .from("producto_imagenes")
    .update({
      variante_id: variantId,
      color,
      actualizado_por: userId,
    })
    .eq("id", imageId)
    .eq("producto_id", productId)
    .eq("activo", true)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw publicServerError(
      "Product image variant update failed",
      error,
      "No se pudo relacionar la imagen con el color.",
    );
  }

  revalidatePublicProducts();
  revalidatePath(`/admin/productos/${productId}/editar`);
}

// Desactiva una imagen conservando el recurso para permitir recuperación.
export async function deleteProductImage(productId: string, imageId: string) {
  const { supabase, userId } = await requireAdmin("catalog.write");
  requireUuid(productId, "Producto");
  requireUuid(imageId, "Imagen");

  const { data: image, error: imageError } = await supabase
    .from("producto_imagenes")
    .select("id, principal")
    .eq("id", imageId)
    .eq("producto_id", productId)
    .maybeSingle();

  if (imageError) {
    throw publicServerError("Product image delete lookup failed", imageError, "No se pudo validar la imagen.");
  }

  if (!image) {
    throw new ProductFormError("Imagen no encontrada.");
  }

  let nextImageId: string | null = null;
  if (image.principal) {
    const { data: nextImage, error: nextImageError } = await supabase
      .from("producto_imagenes")
      .select("id")
      .eq("producto_id", productId)
      .eq("activo", true)
      .order("orden", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImageError) throw publicServerError("Next product image lookup failed", nextImageError, "No se pudo validar la imagen siguiente.");
    nextImageId = nextImage?.id ?? null;
  }

  const { error } = await supabase
    .from("producto_imagenes")
    .update({ activo: false, principal: false, actualizado_por: userId })
    .eq("id", imageId);

  if (error) {
    throw publicServerError("Product image deactivation failed", error, "No se pudo quitar la imagen.");
  }

  if (nextImageId) {
    const { error: promoteError } = await supabase
      .from("producto_imagenes")
      .update({ principal: true, actualizado_por: userId })
      .eq("id", nextImageId);

    if (promoteError) {
      await supabase
        .from("producto_imagenes")
        .update({ activo: true, principal: true, actualizado_por: userId })
        .eq("id", imageId);
      throw publicServerError("Product image fallback promotion failed", promoteError, "No se pudo actualizar la imagen principal.");
    }
  }

  revalidatePublicProducts();
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}/editar`);
}
