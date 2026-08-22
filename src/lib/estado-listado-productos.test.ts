import { describe, expect, it } from "vitest";
import {
  getProductSort,
  readProductListingUrlState,
  sortProducts,
  writeProductListingUrlState,
} from "./estado-listado-productos";
import type { Product } from "@/types/producto";

function product(id: string, name: string, price: number) {
  return {
    id,
    name,
    price,
    variants: [],
    catalogPath: [],
  } as unknown as Product;
}

describe("estado del listado de productos en la URL", () => {
  it("recupera página, orden y todos los filtros tras una recarga", () => {
    const params = new URLSearchParams(
      "pagina=2&orden=price-desc&precio=18&oferta=1&catalogo=senuelos%2Ftrolling&marca=NOEBY&filtro_tecnica=trolling",
    );

    expect(
      readProductListingUrlState(params, {
        maximumPrice: 50,
        defaultSort: "relevance",
        allowRelevance: true,
      }),
    ).toEqual({
      catalogPaths: ["senuelos/trolling"],
      brands: ["NOEBY"],
      attributes: { tecnica: ["trolling"] },
      maxPrice: 18,
      onSale: true,
      sort: "price-desc",
      page: 2,
    });
  });

  it("serializa filtros sin conservar parámetros obsoletos", () => {
    const params = new URLSearchParams(
      "busqueda=carrete&pagina=4&marca=Vieja&filtro_color=azul",
    );
    const next = writeProductListingUrlState(
      params,
      {
        catalogPaths: [],
        brands: ["Shimano"],
        attributes: { tecnica: ["spinning"] },
        maxPrice: 100,
        onSale: false,
        sort: "name-desc",
        page: 1,
      },
      { maximumPrice: 100, defaultSort: "relevance" },
    );

    expect(next.get("busqueda")).toBe("carrete");
    expect(next.getAll("marca")).toEqual(["Shimano"]);
    expect(next.getAll("filtro_tecnica")).toEqual(["spinning"]);
    expect(next.has("filtro_color")).toBe(false);
    expect(next.has("pagina")).toBe(false);
    expect(next.get("orden")).toBe("name-desc");
  });

  it("descarta relevancia fuera de una búsqueda", () => {
    expect(getProductSort("relevance", "name-asc", false)).toBe("name-asc");
    expect(getProductSort("desconocido", "name-asc", true)).toBe("name-asc");
  });

  it("ordena alfabéticamente en ambas direcciones y por precio", () => {
    const products = [
      product("2", "Zebco", 12),
      product("1", "Abu Garcia", 25),
      product("3", "Shimano", 8),
    ];

    expect(sortProducts(products, "name-asc").map((item) => item.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
    expect(sortProducts(products, "name-desc").map((item) => item.id)).toEqual([
      "2",
      "3",
      "1",
    ]);
    expect(sortProducts(products, "price-asc").map((item) => item.id)).toEqual([
      "3",
      "2",
      "1",
    ]);
    expect(sortProducts(products, "price-desc").map((item) => item.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });
});
