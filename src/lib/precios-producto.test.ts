import { describe, expect, it } from "vitest";
import type { Product, ProductVariant } from "../types/producto";
import {
  getEffectivePrice,
  getProductPricingSummary,
  hasActiveOffer,
} from "./precios-producto";

function createVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "variant-1",
    productId: "product-1",
    name: "Opción",
    description: "",
    attributes: {},
    sku: "SKU-1",
    price: 100,
    stock: 2,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  };
}

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    slug: "producto-prueba",
    name: "Producto de prueba",
    sku: "SKU",
    brand: "Marca",
    category: "Cañas",
    categorySlug: "canas",
    subcategory: "Casting",
    subcategorySlug: "casting",
    catalogPath: [],
    price: 100,
    stock: 5,
    description: "",
    features: [],
    attributes: {},
    images: [],
    variants: [],
    mainImage: "/image.webp",
    imageAlt: "Producto",
    isFeatured: false,
    isActive: true,
    ...overrides,
  };
}

describe("precios de producto", () => {
  it("usa una oferta valida", () => {
    expect(hasActiveOffer({ price: 100, offerPrice: 80 })).toBe(true);
    expect(getEffectivePrice({ price: 100, offerPrice: 80 })).toBe(80);
  });

  it("ignora una oferta igual o superior al precio normal", () => {
    expect(hasActiveOffer({ price: 100, offerPrice: 100 })).toBe(false);
    expect(getEffectivePrice({ price: 100, offerPrice: 120 })).toBe(100);
  });

  it("resume correctamente productos sin variantes", () => {
    expect(
      getProductPricingSummary(createProduct({ offerPrice: 75 })),
    ).toMatchObject({
      hasVariants: false,
      hasOffer: true,
      minimumRegularPrice: 100,
      minimumEffectivePrice: 75,
      maximumDiscountPercentage: 25,
    });
  });

  it("calcula el menor precio y mayor descuento entre variantes activas", () => {
    const summary = getProductPricingSummary(
      createProduct({
        variants: [
          createVariant({ id: "v1", price: 120, offerPrice: 90 }),
          createVariant({ id: "v2", price: 80, offerPrice: 60 }),
          createVariant({ id: "v3", price: 20, offerPrice: 5, isActive: false }),
        ],
      }),
    );

    expect(summary.minimumRegularPrice).toBe(80);
    expect(summary.minimumEffectivePrice).toBe(60);
    expect(summary.maximumDiscountPercentage).toBe(25);
  });
});
