import type { CatalogPathItem, Product } from "@/types/producto";

const LURE_TECHNIQUE_SLUGS = new Set(["spinning", "casting", "jigging", "trolling"]);

function catalogPathStartsWith(
  productPath: CatalogPathItem[],
  selectedPath: CatalogPathItem[],
) {
  return selectedPath.every((selectedNode, index) => {
    const productNode = productPath[index];

    if (!productNode) return false;

    if (selectedNode.id && productNode.id) {
      return selectedNode.id === productNode.id;
    }

    return selectedNode.slug === productNode.slug;
  });
}

function normalizeTechnique(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function productHasTechnique(product: Product, techniqueSlug: string) {
  const techniqueValues = [
    product.attributes.tecnica,
    ...product.variants
      .filter((variant) => variant.isActive)
      .map((variant) => variant.attributes.tecnica),
  ];

  return techniqueValues.some(
    (value) => typeof value === "string" && normalizeTechnique(value) === techniqueSlug,
  );
}

// La ruta guardada sigue siendo la clasificación principal. En Señuelos,
// las clasificaciones técnicas de primer nivel funcionan además como facetas.
export function productBelongsToCatalogLanding(
  product: Product,
  selectedPath: CatalogPathItem[],
) {
  if (!product.isActive) return false;

  if (catalogPathStartsWith(product.catalogPath, selectedPath)) {
    return true;
  }

  if (
    selectedPath.length !== 2 ||
    selectedPath[0]?.slug !== "senuelos" ||
    !LURE_TECHNIQUE_SLUGS.has(selectedPath[1]?.slug)
  ) {
    return false;
  }

  return productHasTechnique(product, selectedPath[1].slug);
}
