import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// Lee credenciales de Cloudinary y detecta si falta configuracion.
function getCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

// Crea el cliente Cloudinary configurado para operaciones del servidor.
function getCloudinaryClient() {
  const env = getCloudinaryEnv();

  if (!env) {
    throw new Error("Faltan variables de Cloudinary en .env.local.");
  }

  cloudinary.config({
    cloud_name: env.cloudName,
    api_key: env.apiKey,
    api_secret: env.apiSecret,
    secure: true,
  });

  return cloudinary;
}

// Sube una imagen de producto y devuelve los datos que se guardan en Supabase.
export async function uploadProductImage(file: File, folder = "pesca-con-fe/productos") {
  const bytes = Buffer.from(await file.arrayBuffer());
  const client = getCloudinaryClient();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary no devolvio resultado."));
          return;
        }

        resolve(result);
      },
    );

    stream.end(bytes);
  });
}

// Elimina de Cloudinary una imagen que ya no debe usarse en el producto.
export async function deleteCloudinaryImage(publicId: string) {
  const client = getCloudinaryClient();
  await client.uploader.destroy(publicId, { resource_type: "image" });
}
