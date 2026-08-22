import { describe, expect, it } from "vitest";
import {
  getProductAttributeValues,
  getValidCatalogCategory,
} from "./filtros-catalogo";

const categories = [
  { slug: "canas" },
  { slug: "carretes" },
  { slug: "senuelos" },
];

describe("filtros del catálogo desde la URL", () => {
  it("conserva una categoría válida", () => {
    expect(getValidCatalogCategory("carretes", categories)).toBe("carretes");
  });

  it("ignora una categoría inexistente para no ocultar todos los productos", () => {
    expect(getValidCatalogCategory("carrete", categories)).toBe("all");
  });
});

describe("valores de características para filtros", () => {
  it("conserva la especificación base cuando el producto tiene opciones", () => {
    expect(
      getProductAttributeValues(
        {
          attributes: { longitud: "10 pulgadas" },
          variants: [
            { attributes: { color: "Azul" }, isActive: true },
            { attributes: { color: "Dorado" }, isActive: true },
          ],
        },
        "longitud",
      ),
    ).toEqual(["10 pulgadas"]);
  });

  it("combina valores base y de opciones activas", () => {
    expect(
      getProductAttributeValues(
        {
          attributes: { tamano: "4000" },
          variants: [
            { attributes: { tamano: "5000" }, isActive: true },
            { attributes: { tamano: "6000" }, isActive: false },
          ],
        },
        "tamano",
      ),
    ).toEqual(["4000", "5000"]);
  });

  it("ignora valores vacíos", () => {
    expect(
      getProductAttributeValues(
        {
          attributes: { tecnica: "  " },
          variants: [{ attributes: {}, isActive: true }],
        },
        "tecnica",
      ),
    ).toEqual([]);
  });
});
