"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadProductImage } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

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

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

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

export async function saveProduct(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const relations = await resolveProductRelations(formData);
  const productId = getText(formData, "productId");
  const features = getText(formData, "features")
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);

  const payload = {
    categoria_id: relations.categoryId,
    subcategoria_id: relations.subcategoryId,
    marca_id: relations.brandId,
    slug: getText(formData, "slug"),
    nombre: getText(formData, "name"),
    sku: getText(formData, "sku"),
    precio: Number(getText(formData, "price")),
    stock: Number(getText(formData, "stock")),
    descripcion: getText(formData, "description"),
    caracteristicas: features,
    youtube_video_id: getYouTubeVideoId(getText(formData, "youtubeVideoId")),
    destacado: formData.get("isFeatured") === "on",
    activo: formData.get("isActive") === "on",
    actualizado_por: userId,
  };

  if (productId) {
    const { error } = await supabase.from("productos").update(payload).eq("id", productId);
    if (error) {
      throw new Error(error.message);
    }
    await uploadImagesForProduct(productId, formData, userId);
  } else {
    const { data, error } = await supabase
      .from("productos")
      .insert({ ...payload, creado_por: userId })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "No se pudo crear el producto.");
    }

    await uploadImagesForProduct(data.id, formData, userId);
  }

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function toggleProductActive(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const id = getText(formData, "id");
  const active = getText(formData, "active") === "true";

  await supabase
    .from("productos")
    .update({ activo: !active, actualizado_por: userId })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

export async function deleteProduct(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const id = getText(formData, "id");

  await supabase
    .from("productos")
    .update({ activo: false, actualizado_por: userId })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

export async function setMainImage(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const productId = getText(formData, "productId");
  const imageId = getText(formData, "imageId");

  await supabase
    .from("producto_imagenes")
    .update({ principal: false, actualizado_por: userId })
    .eq("producto_id", productId);
  await supabase
    .from("producto_imagenes")
    .update({ principal: true, actualizado_por: userId })
    .eq("id", imageId);

  revalidatePath("/admin/productos");
}

export async function deleteProductImage(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const productId = getText(formData, "productId");
  const imageId = getText(formData, "imageId");

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

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}
