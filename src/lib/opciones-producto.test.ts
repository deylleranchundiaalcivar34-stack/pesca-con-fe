import { describe, expect, it } from "vitest";
import {
  DEFAULT_CURRICAN_BASE_OPTION_NAME,
  getAutomaticVariantSummary,
  getProductBaseOptionName,
  hasColorVariants,
  hasSizeVariants,
  isCurricanProduct,
  isLureAccessoryPath,
  SIZE_VARIANT_ATTRIBUTE_KEY,
  SIZE_VARIANT_MODE_VALUE,
  VARIANT_MODE_ATTRIBUTE_KEY,
} from "@/lib/opciones-producto";

describe("product base options", () => {
  it("detects the lure accessories branch and all its descendants", () => {
    expect(
      isLureAccessoryPath([
        { slug: "senuelos" },
        { slug: "accesorios-para-senuelos" },
        { slug: "faldas" },
      ]),
    ).toBe(true);

    expect(
      isLureAccessoryPath([
        { slug: "senuelos" },
        { slug: "trolling" },
      ]),
    ).toBe(false);

    expect(
      isLureAccessoryPath([
        { slug: "herramientas-y-accesorios" },
        { slug: "accesorios-para-senuelos" },
      ]),
    ).toBe(false);
  });

  it("keeps the legacy label when a currican has no custom base name", () => {
    expect(getProductBaseOptionName({})).toBe(
      DEFAULT_CURRICAN_BASE_OPTION_NAME,
    );
    expect(getProductBaseOptionName({ baseOptionName: "   " })).toBe(
      DEFAULT_CURRICAN_BASE_OPTION_NAME,
    );
  });

  it("uses the custom name without surrounding whitespace", () => {
    expect(
      getProductBaseOptionName({
        baseOptionName: "  Señuelo con cabeza y dos faldas  ",
      }),
    ).toBe("Señuelo con cabeza y dos faldas");
  });

  it("detects curricanes anywhere in the catalog path", () => {
    expect(
      isCurricanProduct({
        catalogPath: [
          { name: "Señuelos", slug: "senuelos", level: "Categoría" },
          { name: "Mar", slug: "para-mar", level: "Uso" },
          { name: "Curricanes", slug: "curricanes", level: "Tipo" },
        ],
      }),
    ).toBe(true);
  });

  it("detects color variants independently of the product category", () => {
    expect(
      hasColorVariants({
        catalogPath: [
          {
            name: "Herramientas y Accesorios",
            slug: "herramientas-y-accesorios",
            level: "Categoría",
          },
        ],
        variants: [
          {
            id: "variant-1",
            productId: "product-1",
            name: "Azul",
            description: "",
            attributes: { color: "Azul" },
            sku: "PINZA-AZUL",
            price: 12,
            stock: 3,
            isActive: true,
            sortOrder: 1,
          },
        ],
      }),
    ).toBe(true);
  });

  it("does not treat currican configurations as color variants", () => {
    expect(
      hasColorVariants({
        catalogPath: [
          { name: "Señuelos", slug: "senuelos", level: "Categoría" },
          { name: "Curricanes", slug: "curricanes", level: "Tipo" },
        ],
        variants: [
          {
            id: "variant-1",
            productId: "product-1",
            name: "Armado azul",
            description: "",
            attributes: { color: "Azul" },
            sku: "",
            price: 35,
            stock: 2,
            isActive: true,
            sortOrder: 1,
          },
        ],
      }),
    ).toBe(false);
  });

  it("detects explicit size variants without confusing legacy generic options", () => {
    const baseProduct = {
      catalogPath: [
        { name: "Señuelos", slug: "senuelos", level: "Categoría" },
        { name: "Faldas", slug: "faldas", level: "Tipo" },
      ],
    };

    expect(
      hasSizeVariants({
        ...baseProduct,
        variants: [
          {
            id: "variant-1",
            productId: "product-1",
            name: "9 pulgadas",
            description: "",
            attributes: {
              [SIZE_VARIANT_ATTRIBUTE_KEY]: "9 pulgadas",
              [VARIANT_MODE_ATTRIBUTE_KEY]: SIZE_VARIANT_MODE_VALUE,
            },
            sku: "FAL-NAR-09",
            price: 10,
            stock: 4,
            isActive: true,
            sortOrder: 1,
          },
        ],
      }),
    ).toBe(true);

    expect(
      hasSizeVariants({
        ...baseProduct,
        variants: [
          {
            id: "variant-2",
            productId: "product-1",
            name: "Tamaño 4000",
            description: "",
            attributes: { tamano: "4000" },
            sku: "",
            price: 30,
            stock: 2,
            isActive: true,
            sortOrder: 1,
          },
        ],
      }),
    ).toBe(false);
  });

  it("calculates the minimum active price and total active stock", () => {
    expect(
      getAutomaticVariantSummary([
        { price: 12, stock: 4, isActive: true },
        { price: 10, stock: 2, isActive: true },
        { price: 8, stock: 20, isActive: false },
      ]),
    ).toEqual({ price: 10, stock: 6 });
  });

  it("keeps a stable minimum price when every variant is inactive", () => {
    expect(
      getAutomaticVariantSummary([
        { price: 12, stock: 4, isActive: false },
        { price: 10, stock: 2, isActive: false },
      ]),
    ).toEqual({ price: 10, stock: 0 });
  });
});
