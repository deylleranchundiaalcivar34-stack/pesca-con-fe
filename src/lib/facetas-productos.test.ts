import { describe, expect, it } from "vitest";
import type {
  CatalogAttribute,
  CatalogNode,
  Product,
  ProductVariant,
} from "@/types/producto";
import {
  buildCatalogFilterOptions,
  buildProductAttributeFacets,
} from "./facetas-productos";

function node(
  id: string,
  name: string,
  slug: string,
  level: string,
  children: CatalogNode[] = [],
): CatalogNode {
  return {
    id,
    parentId: null,
    name,
    slug,
    level,
    description: "",
    image: null,
    isActive: true,
    sortOrder: 0,
    children,
  };
}

function product(
  id: string,
  path: Array<{ id: string; name: string; slug: string; level: string }>,
  attributes: Record<string, string> = {},
  variants: ProductVariant[] = [],
) {
  return {
    id,
    name: id,
    catalogPath: path,
    attributes,
    variants,
  } as unknown as Product;
}

function variant(
  id: string,
  size: string,
): ProductVariant {
  return {
    id,
    productId: "falda",
    name: size,
    description: "",
    attributes: { tamano: size, modo_variante: "tamano" },
    sku: id,
    price: 10,
    stock: 1,
    isActive: true,
    sortOrder: 0,
  };
}

function attribute(
  id: string,
  catalogNodeId: string,
  label: string,
): CatalogAttribute {
  return {
    id,
    catalogNodeId,
    key: "tamano",
    label,
    type: "texto",
    options: [],
    isRequired: true,
    isFilterable: true,
    sortOrder: 1,
  };
}

describe("facetas del catálogo", () => {
  it("conserva el árbol completo y suma productos en todos sus ancestros", () => {
    const tree = [
      node("senuelos", "Señuelos", "senuelos", "Categoría", [
        node("accesorios", "Accesorios", "accesorios", "Clasificación", [
          node("faldas", "Faldas", "faldas", "Subclasificación"),
          node("anillas", "Anillas", "anillas", "Subclasificación"),
        ]),
        node("trolling", "Trolling", "trolling", "Clasificación"),
      ]),
      node("canas", "Cañas", "canas", "Categoría"),
    ];
    const products = [
      product("falda", [
        { id: "senuelos", name: "Señuelos", slug: "senuelos", level: "Categoría" },
        { id: "accesorios", name: "Accesorios", slug: "accesorios", level: "Clasificación" },
        { id: "faldas", name: "Faldas", slug: "faldas", level: "Subclasificación" },
      ]),
      product("trolling", [
        { id: "senuelos", name: "Señuelos", slug: "senuelos", level: "Categoría" },
        { id: "trolling", name: "Trolling", slug: "trolling", level: "Clasificación" },
      ]),
    ];

    const options = buildCatalogFilterOptions(tree, products);

    expect(options.map(({ label, count }) => [label, count])).toEqual([
      ["Cañas", 0],
      ["Señuelos", 2],
    ]);
    const lureOptions = options.find((option) => option.value === "senuelos");
    expect(lureOptions?.children?.map(({ label, count }) => [label, count])).toEqual([
      ["Accesorios", 1],
      ["Trolling", 1],
    ]);
    expect(lureOptions?.children?.[0]?.children?.map(({ label, count }) => [label, count])).toEqual([
      ["Anillas", 0],
      ["Faldas", 1],
    ]);
  });

  it("no mezcla tamaños de accesorios con la etiqueta de carretes o combos", () => {
    const tree = [
      node("carretes", "Carretes", "carretes", "Categoría"),
      node("combos", "Combos", "combos", "Categoría"),
      node("senuelos", "Señuelos", "senuelos", "Categoría", [
        node("accesorios", "Accesorios", "accesorios", "Clasificación", [
          node("faldas", "Faldas", "faldas", "Subclasificación"),
        ]),
      ]),
    ];
    const products = [
      product(
        "carrete",
        [{ id: "carretes", name: "Carretes", slug: "carretes", level: "Categoría" }],
        { tamano: "4000" },
      ),
      product(
        "combo",
        [{ id: "combos", name: "Combos", slug: "combos", level: "Categoría" }],
        { tamano: "5000" },
      ),
      product(
        "falda",
        [
          { id: "senuelos", name: "Señuelos", slug: "senuelos", level: "Categoría" },
          { id: "accesorios", name: "Accesorios", slug: "accesorios", level: "Clasificación" },
          { id: "faldas", name: "Faldas", slug: "faldas", level: "Subclasificación" },
        ],
        {},
        [variant("falda-9", 'Falda de silicona de 9"')],
      ),
    ];

    const facets = buildProductAttributeFacets(
      products,
      [
        attribute("tamano-carrete", "carretes", "Tamaño"),
        attribute("tamano-combo", "combos", "Tamaño del carrete"),
      ],
      tree,
    );

    expect(facets.map((facet) => facet.label)).toEqual([
      "Tamaño",
      "Tamaño · Faldas",
      "Tamaño del carrete",
    ]);
    expect(
      facets.find((facet) => facet.label === "Tamaño del carrete")?.options,
    ).toEqual([{ value: "5000", label: "5000", count: 1 }]);
    expect(
      facets.find((facet) => facet.label === "Tamaño · Faldas")?.options,
    ).toEqual([
      {
        value: "falda de silicona de 9",
        label: '9"',
        count: 1,
      },
    ]);
  });
});
