import { describe, expect, it } from "vitest";
import { getValidCatalogCategory } from "./filtros-catalogo";

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
