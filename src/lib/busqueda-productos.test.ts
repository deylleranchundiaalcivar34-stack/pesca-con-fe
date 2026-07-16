import { describe, expect, it } from "vitest";
import {
  getSearchTerms,
  matchesProductSearch,
  normalizeSearchText,
} from "./busqueda-productos";

describe("busqueda de productos", () => {
  it("normaliza acentos, mayusculas y signos", () => {
    expect(normalizeSearchText("  CAÑAS / Acción rápida  ")).toBe(
      "canas accion rapida",
    );
  });

  it("expande sinonimos comerciales", () => {
    expect(getSearchTerms("reel")).toEqual(
      expect.arrayContaining(["carrete", "reel", "molinete"]),
    );
  });

  it("encuentra productos mediante sinonimos", () => {
    expect(
      matchesProductSearch("reel spinning", "Carrete Shimano para pesca spinning"),
    ).toBe(true);
  });

  it("descarta coincidencias que no contienen todos los terminos", () => {
    expect(matchesProductSearch("carrete dorado", "Carrete Shimano negro")).toBe(false);
  });
});
