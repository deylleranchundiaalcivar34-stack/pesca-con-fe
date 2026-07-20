import { describe, expect, it } from "vitest";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGE_FILES,
  validateProductImageFiles,
} from "./seguridad-imagenes";

describe("validateProductImageFiles", () => {
  it("acepta una imagen PNG cuya firma coincide", async () => {
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "producto.png",
      { type: "image/png" },
    );

    await expect(validateProductImageFiles([file])).resolves.toBeUndefined();
  });

  it("rechaza un archivo disfrazado de imagen", async () => {
    const file = new File(["contenido ejecutable"], "producto.png", {
      type: "image/png",
    });

    await expect(validateProductImageFiles([file])).rejects.toThrow("no coincide");
  });

  it("rechaza archivos cuyo tipo no es una imagen permitida", async () => {
    const file = new File(["contenido"], "producto.txt", { type: "text/plain" });

    await expect(validateProductImageFiles([file])).rejects.toThrow("Solo se permiten");
  });

  it("rechaza una imagen de más de 4 MB", async () => {
    const file = new File(
      [new Uint8Array([0xff, 0xd8, 0xff]), new Uint8Array(MAX_PRODUCT_IMAGE_BYTES)],
      "producto.jpg",
      { type: "image/jpeg" },
    );

    await expect(validateProductImageFiles([file])).rejects.toThrow("máximo 4 MB");
  });

  it("rechaza un lote de imágenes mayor a 5 MB", async () => {
    const files = Array.from(
      { length: 2 },
      (_, index) =>
        new File(
          [new Uint8Array([0xff, 0xd8, 0xff]), new Uint8Array(3 * 1024 * 1024)],
          `${index}.jpg`,
          { type: "image/jpeg" },
        ),
    );

    await expect(validateProductImageFiles(files)).rejects.toThrow("lote");
  });

  it("limita el número de imágenes por lote", async () => {
    const files = Array.from(
      { length: MAX_PRODUCT_IMAGE_FILES + 1 },
      (_, index) =>
        new File([new Uint8Array([0xff, 0xd8, 0xff])], `${index}.jpg`, {
          type: "image/jpeg",
        }),
    );

    await expect(validateProductImageFiles(files)).rejects.toThrow("como máximo");
  });
});
