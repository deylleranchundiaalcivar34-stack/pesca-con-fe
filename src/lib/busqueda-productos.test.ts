import { describe, expect, it } from "vitest";
import {
  getProductSearchRank,
  getProductTitleSearchRank,
  getRelatedSearchSuggestions,
  getSearchTerms,
  matchesProductTitleSearch,
  normalizeSearchText,
  rankProductsForSearch,
  type ProductSearchSource,
} from "./busqueda-productos";

function createSearchProduct(
  overrides: Partial<ProductSearchSource> = {},
): ProductSearchSource {
  return {
    id: overrides.id ?? "product-1",
    name: overrides.name ?? "Señuelo de pesca",
    slug: overrides.slug ?? "senuelo-de-pesca",
    brand: overrides.brand ?? "Pesca Con Fe",
    category: overrides.category ?? "Señuelos",
    categorySlug: overrides.categorySlug ?? "senuelos",
    subcategory: overrides.subcategory ?? "Para mar",
    subcategorySlug: overrides.subcategorySlug ?? "para-mar",
    catalogPath:
      overrides.catalogPath ??
      [
        { name: "Señuelos", slug: "senuelos", level: "Categoría" },
        { name: "Para mar", slug: "para-mar", level: "Clasificación" },
        {
          name: "Curricanes",
          slug: "curricanes",
          level: "Subclasificación",
        },
      ],
    attributes: overrides.attributes ?? {},
    variants: overrides.variants ?? [],
  };
}

describe("búsqueda de productos", () => {
  it("normaliza acentos, mayúsculas y signos", () => {
    expect(normalizeSearchText("  CAÑAS / Acción rápida  ")).toBe(
      "canas accion rapida",
    );
  });

  it("genera candidatos gramaticales sin expandir sinónimos", () => {
    expect(getSearchTerms("señuelos reel")).toEqual([
      "senuelos",
      "senuelo",
      "reel",
    ]);
  });

  it("encuentra la palabra únicamente cuando aparece en el título", () => {
    expect(
      matchesProductTitleSearch(
        "trolling",
        "Señuelo Curricán Trolling Pesca Con Fe",
      ),
    ).toBe(true);
    expect(
      matchesProductTitleSearch(
        "trolling",
        "Falda de Silicona para Curricán",
      ),
    ).toBe(false);
  });

  it("también encuentra coincidencias en clasificación y atributos", () => {
    const product = createSearchProduct({
      name: "Señuelo NOEBY NBL 9046S",
      catalogPath: [
        { name: "Señuelos", slug: "senuelos", level: "Categoría" },
        { name: "Trolling", slug: "trolling", level: "Clasificación" },
      ],
      attributes: { tecnica: "Trolling" },
    });

    expect(getProductSearchRank("trolling", product)).not.toBeNull();
  });

  it("unifica los ocho títulos y los dos productos clasificados como Trolling", () => {
    const products = [
      ...Array.from({ length: 8 }, (_, index) =>
        createSearchProduct({
          id: `title-${index}`,
          name: `Señuelo Curricán Trolling ${index}`,
          attributes: { tecnica: "Trolling" },
        }),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        createSearchProduct({
          id: `taxonomy-${index}`,
          name: `Señuelo NOEBY ${index}`,
          catalogPath: [
            { name: "Señuelos", slug: "senuelos", level: "Categoría" },
            { name: "Trolling", slug: "trolling", level: "Clasificación" },
          ],
          attributes: { tecnica: "Trolling" },
        }),
      ),
    ];

    expect(rankProductsForSearch("trolling", products)).toHaveLength(10);
  });

  it("admite escritura parcial y diferencias de singular o plural", () => {
    expect(matchesProductTitleSearch("troll", "Señuelo Trolling")).toBe(true);
    expect(matchesProductTitleSearch("curricanes", "Señuelo Curricán")).toBe(true);
  });

  it("prioriza la frase completa sobre coincidencias parciales", () => {
    expect(getProductTitleSearchRank("trolling", "Trolling Señuelo")).toBe(1);
    expect(getProductTitleSearchRank("trolling", "Señuelo Trolling")).toBe(2);
  });

  it("recomienda destinos relacionados ante un error de escritura", () => {
    expect(getRelatedSearchSuggestions("troling")).toEqual([
      { label: "Trolling", href: "/productos?busqueda=Trolling" },
      {
        label: "Curricanes",
        href: "/productos?busqueda=Curricanes",
      },
      {
        label: "Señuelos para mar",
        href: "/productos/senuelos/para-mar",
      },
    ]);
  });

  it("no inventa recomendaciones para términos desconocidos", () => {
    expect(getRelatedSearchSuggestions("xyzabc")).toEqual([]);
  });
});
