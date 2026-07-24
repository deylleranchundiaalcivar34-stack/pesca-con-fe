import { describe, expect, it } from "vitest";
import {
  DEFAULT_CURRICAN_BASE_OPTION_NAME,
  getProductBaseOptionName,
  isCurricanProduct,
} from "@/lib/opciones-producto";

describe("product base options", () => {
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
});
