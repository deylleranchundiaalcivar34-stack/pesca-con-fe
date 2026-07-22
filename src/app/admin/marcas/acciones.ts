"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { UploadApiResponse } from "cloudinary";
import { deleteCloudinaryImage, uploadBrandImage } from "@/lib/cloudinary";
import {
  MAX_BRAND_IMAGE_BYTES,
  MAX_BRAND_IMAGE_DIMENSION,
  validateBrandImageFiles,
} from "@/lib/seguridad-imagenes";
import {
  PublicServerError,
  publicServerError,
  reportServerError,
} from "@/lib/safe-server-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { slugify } from "@/lib/utilidades";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BrandActionState = {
  status: "idle" | "error";
  message: string;
};

class BrandFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrandFormError";
  }
}

// Lee un campo de FormData como texto limpio.
function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function requireUuid(value: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new BrandFormError("Marca no encontrada.");
  }
  return value;
}

function getBrandImageFiles(formData: FormData) {
  return formData
    .getAll("image")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function prepareBrandImage(formData: FormData, required: boolean) {
  const files = getBrandImageFiles(formData);

  try {
    await validateBrandImageFiles(files, required);
  } catch (error) {
    throw new BrandFormError(
      error instanceof Error ? error.message : "No se pudo validar la imagen.",
    );
  }

  return files[0] ?? null;
}

function validateUploadedBrandImage(result: UploadApiResponse) {
  if (
    result.resource_type !== "image" ||
    result.bytes <= 0 ||
    result.bytes > MAX_BRAND_IMAGE_BYTES ||
    result.width <= 0 ||
    result.width > MAX_BRAND_IMAGE_DIMENSION ||
    result.height <= 0 ||
    result.height > MAX_BRAND_IMAGE_DIMENSION ||
    !result.public_id ||
    !result.secure_url ||
    !result.format
  ) {
    throw new BrandFormError("Cloudinary rechazó la imagen por tamaño o dimensiones.");
  }
}

function getLogoPayload(result: UploadApiResponse) {
  return {
    cloudinary_public_id: result.public_id,
    cloudinary_secure_url: result.secure_url,
    cloudinary_format: result.format,
    cloudinary_width: result.width,
    cloudinary_height: result.height,
    cloudinary_bytes: result.bytes,
  };
}

const emptyLogoPayload = {
  cloudinary_public_id: null,
  cloudinary_secure_url: null,
  cloudinary_format: null,
  cloudinary_width: null,
  cloudinary_height: null,
  cloudinary_bytes: null,
};

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}

// Invalida filtros, detalle de producto y páginas que muestran marcas.
function revalidatePublicBrands() {
  updateTag("brands");
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[...slug]", "page");
  revalidatePath("/producto/[slug]", "page");
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
}

async function persistNewBrand(formData: FormData) {
  const { supabase } = await requireAdmin("catalog.write");
  const name = getText(formData, "name");
  const slug = slugify(name);

  if (!name || !slug) {
    throw new BrandFormError("Escribe un nombre válido para la marca.");
  }
  if ([...name].length > 120) {
    throw new BrandFormError("El nombre supera el máximo de 120 caracteres.");
  }

  const image = await prepareBrandImage(formData, true);
  if (!image) throw new BrandFormError("Selecciona una imagen para la marca.");

  const uploaded = await uploadBrandImage(image);

  try {
    validateUploadedBrandImage(uploaded);

    const { data, error } = await supabase
      .from("marcas")
      .insert({
        nombre: name,
        slug,
        activa: true,
        ...getLogoPayload(uploaded),
      })
      .select("id")
      .single();

    if (error || !data) {
      if (isUniqueViolation(error)) {
        throw new BrandFormError("Ya existe una marca con ese nombre o slug.");
      }
      throw publicServerError(
        "Admin brand creation failed",
        error,
        "No se pudo crear la marca.",
      );
    }
  } catch (error) {
    await Promise.allSettled([deleteCloudinaryImage(uploaded.public_id)]);
    throw error;
  }

  revalidatePublicBrands();
}

async function persistBrandUpdate(formData: FormData) {
  const { supabase } = await requireAdmin("catalog.write");
  const id = requireUuid(getText(formData, "id"));
  const name = getText(formData, "name");

  if (!name) {
    throw new BrandFormError("Escribe un nombre válido para la marca.");
  }
  if ([...name].length > 120) {
    throw new BrandFormError("El nombre supera el máximo de 120 caracteres.");
  }

  // El cliente privilegiado solo lee el public_id oculto después de que la
  // sesión administradora ya superó catalog.write y AAL2.
  const internal = createAdminClient();
  const { data: existing, error: existingError } = await internal
    .from("marcas")
    .select("id, cloudinary_public_id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    throw publicServerError(
      "Admin brand internal lookup failed",
      existingError,
      "No se pudo validar la marca.",
    );
  }
  if (!existing) throw new BrandFormError("Marca no encontrada.");

  const removeLogo = getText(formData, "removeLogo") === "true";
  const image = await prepareBrandImage(formData, false);
  if (removeLogo && image) {
    throw new BrandFormError("Elige entre reemplazar la imagen o quitar la actual.");
  }
  const uploaded = image ? await uploadBrandImage(image) : null;

  try {
    if (uploaded) validateUploadedBrandImage(uploaded);

    const { data, error } = await supabase
      .from("marcas")
      .update({
        nombre: name,
        ...(uploaded
          ? getLogoPayload(uploaded)
          : removeLogo
            ? emptyLogoPayload
            : {}),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      if (isUniqueViolation(error)) {
        throw new BrandFormError("Ya existe una marca con ese nombre.");
      }
      throw publicServerError(
        "Admin brand update failed",
        error,
        "No se pudo actualizar la marca.",
      );
    }
  } catch (error) {
    if (uploaded) {
      await Promise.allSettled([deleteCloudinaryImage(uploaded.public_id)]);
    }
    throw error;
  }

  if ((uploaded || removeLogo) && existing.cloudinary_public_id) {
    try {
      await deleteCloudinaryImage(existing.cloudinary_public_id);
    } catch (error) {
      reportServerError("Previous brand logo cleanup failed", error);
    }
  }

  revalidatePublicBrands();
}

function brandActionError(error: unknown, context: string): BrandActionState {
  if (error instanceof BrandFormError || error instanceof PublicServerError) {
    return { status: "error", message: error.message };
  }

  const correlationId = reportServerError(context, error);
  return {
    status: "error",
    message: `No se pudo guardar la marca. Intenta nuevamente. Referencia: ${correlationId}`,
  };
}

// Crea una marca y exige un único logo válido.
export async function saveBrand(
  _previousState: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  try {
    await persistNewBrand(formData);
  } catch (error) {
    return brandActionError(error, "Unexpected brand creation failure");
  }

  redirect("/admin/marcas");
}

// Edita el nombre y permite conservar, reemplazar o quitar el logo administrado.
export async function updateBrand(
  _previousState: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  try {
    await persistBrandUpdate(formData);
  } catch (error) {
    return brandActionError(error, "Unexpected brand update failure");
  }

  redirect("/admin/marcas");
}

// Activa o desactiva una marca sin borrar relaciones ni recursos.
export async function setBrandActive(formData: FormData) {
  const { supabase } = await requireAdmin("catalog.write");
  const id = requireUuid(getText(formData, "id"));
  const active = getText(formData, "active") === "true";

  const { data, error } = await supabase
    .from("marcas")
    .update({ activa: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw publicServerError(
      "Admin brand status update failed",
      error,
      active ? "No se pudo reactivar la marca." : "No se pudo quitar la marca.",
    );
  }

  revalidatePublicBrands();
}
