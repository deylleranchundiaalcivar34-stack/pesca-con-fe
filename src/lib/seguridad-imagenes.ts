export const MAX_PRODUCT_IMAGE_FILES = 6;
export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_BATCH_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_DIMENSION = 8_000;
export const MAX_PRODUCT_IMAGES = 20;
export const MAX_BRAND_IMAGE_FILES = 1;
export const MAX_BRAND_IMAGE_BYTES = MAX_PRODUCT_IMAGE_BYTES;
export const MAX_BRAND_IMAGE_DIMENSION = MAX_PRODUCT_IMAGE_DIMENSION;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function hasBytes(bytes: Uint8Array, expected: number[], offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function matchesDeclaredImageType(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return hasBytes(bytes, [0xff, 0xd8, 0xff]);
  if (type === "image/png") {
    return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (type === "image/webp") {
    return hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8);
  }
  if (type === "image/avif") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    return hasBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4) && ["avif", "avis"].includes(brand);
  }
  return false;
}

async function validateImageFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Solo se permiten imágenes JPEG, PNG, WebP o AVIF.");
  }
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Cada imagen debe pesar como máximo 4 MB.");
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesDeclaredImageType(header, file.type)) {
    throw new Error("El contenido de una imagen no coincide con su tipo declarado.");
  }
}

// Valida tanto el MIME declarado como la firma binaria antes de generar costos
// o recursos externos en Cloudinary.
export async function validateProductImageFiles(files: File[]) {
  if (files.length > MAX_PRODUCT_IMAGE_FILES) {
    throw new Error(`Sube como máximo ${MAX_PRODUCT_IMAGE_FILES} imágenes por vez.`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_PRODUCT_IMAGE_BATCH_BYTES) {
    throw new Error("El lote de imágenes supera el límite permitido de 5 MB.");
  }

  for (const file of files) {
    await validateImageFile(file);
  }
}

// Las marcas admiten exactamente un logo por operación. El formulario de
// edición puede enviar cero archivos para conservar el logo actual.
export async function validateBrandImageFiles(files: File[], required = false) {
  if (files.length > MAX_BRAND_IMAGE_FILES) {
    throw new Error("Solo se permite una imagen por marca.");
  }
  if (required && files.length !== MAX_BRAND_IMAGE_FILES) {
    throw new Error("Selecciona una imagen para la marca.");
  }

  for (const file of files) {
    await validateImageFile(file);
  }
}
