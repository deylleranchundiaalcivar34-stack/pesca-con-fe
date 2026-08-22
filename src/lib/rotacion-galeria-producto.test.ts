import { describe, expect, it } from "vitest";
import { canAutoRotateProductGallery } from "./rotacion-galeria-producto";

const createImage = (id: string) => ({
  id,
  url: `/images/${id}.jpg`,
  alt: `Imagen ${id}`,
});

const createVariant = (isActive: boolean) => ({
  id: "variant-1",
  productId: "product-1",
  name: "Opción",
  description: "",
  attributes: {},
  sku: "SKU-1",
  price: 10,
  stock: 1,
  isActive,
  sortOrder: 0,
});

describe("rotación automática de la galería", () => {
  it("se activa desde dos imágenes cuando no existen opciones activas", () => {
    expect(
      canAutoRotateProductGallery({
        images: [createImage("one"), createImage("two")],
        variants: [],
      }),
    ).toBe(true);
  });

  it("no se activa con una sola imagen", () => {
    expect(
      canAutoRotateProductGallery({
        images: [createImage("one")],
        variants: [],
      }),
    ).toBe(false);
  });

  it("no se activa cuando el producto tiene una opción activa", () => {
    expect(
      canAutoRotateProductGallery({
        images: [createImage("one"), createImage("two")],
        variants: [createVariant(true)],
      }),
    ).toBe(false);
  });

  it("ignora opciones inactivas que no se muestran al cliente", () => {
    expect(
      canAutoRotateProductGallery({
        images: [createImage("one"), createImage("two")],
        variants: [createVariant(false)],
      }),
    ).toBe(true);
  });
});
