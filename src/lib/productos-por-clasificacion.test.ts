import { describe, expect, it } from "vitest";
import { productBelongsToCatalogLanding } from "@/lib/productos-por-clasificacion";
import type { CatalogPathItem, Product } from "@/types/producto";

const lureRoot: CatalogPathItem = {
  id: "lures",
  name: "Señuelos",
  slug: "senuelos",
  level: "Categoría",
};
const trollingNode: CatalogPathItem = {
  id: "technique-trolling",
  name: "Trolling",
  slug: "trolling",
  level: "Clasificación",
};
const seaNode: CatalogPathItem = {
  id: "sea",
  name: "Para mar",
  slug: "para-mar",
  level: "Clasificación",
};
const curricanNode: CatalogPathItem = {
  id: "curricans",
  name: "Curricanes",
  slug: "curricanes",
  level: "Subclasificación",
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product",
    slug: "currican",
    name: "Curricán",
    sku: "CUR-1",
    brand: "Pesca Con Fe",
    category: "Señuelos",
    categorySlug: "senuelos",
    subcategory: "Para mar",
    subcategorySlug: "para-mar",
    catalogPath: [lureRoot, seaNode, curricanNode],
    price: 20,
    stock: 1,
    description: "",
    features: [],
    attributes: { tecnica: "Trolling" },
    images: [],
    variants: [],
    mainImage: "",
    imageAlt: "",
    isFeatured: false,
    isActive: true,
    ...overrides,
  };
}

describe("productBelongsToCatalogLanding", () => {
  it("incluye en Trolling un curricán clasificado principalmente para mar", () => {
    expect(
      productBelongsToCatalogLanding(makeProduct(), [lureRoot, trollingNode]),
    ).toBe(true);
  });

  it("lee la técnica desde una opción activa cuando no está en el producto", () => {
    const product = makeProduct({
      attributes: {},
      variants: [
        {
          id: "variant",
          productId: "product",
          name: "Opción",
          description: "",
          attributes: { tecnica: "TROLLING" },
          sku: "CUR-1-A",
          price: 20,
          stock: 1,
          isActive: true,
          sortOrder: 0,
        },
      ],
    });

    expect(productBelongsToCatalogLanding(product, [lureRoot, trollingNode])).toBe(true);
  });

  it("conserva la pertenencia a la ruta principal", () => {
    expect(productBelongsToCatalogLanding(makeProduct(), [lureRoot, seaNode])).toBe(true);
  });

  it("no mezcla otras técnicas ni productos desactivados", () => {
    expect(
      productBelongsToCatalogLanding(
        makeProduct({ attributes: { tecnica: "Casting" } }),
        [lureRoot, trollingNode],
      ),
    ).toBe(false);
    expect(
      productBelongsToCatalogLanding(
        makeProduct({ isActive: false }),
        [lureRoot, trollingNode],
      ),
    ).toBe(false);
  });
});
