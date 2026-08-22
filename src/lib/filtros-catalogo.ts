type CatalogCategorySlug = {
  slug: string;
};

type ProductAttributeSource = {
  attributes: Record<string, string>;
  variants: Array<{
    attributes: Record<string, string>;
    isActive: boolean;
  }>;
};

// Un filtro externo solo se aplica si corresponde a una categoría disponible.
// Así, un enlace antiguo o mal escrito nunca deja el catálogo vacío sin mostrar
// una selección visible al usuario.
export function getValidCatalogCategory(
  categoryFromUrl: string | null | undefined,
  categories: CatalogCategorySlug[],
) {
  if (!categoryFromUrl || categoryFromUrl === "all") return "all";

  return categories.some((category) => category.slug === categoryFromUrl)
    ? categoryFromUrl
    : "all";
}

// Los datos generales siguen siendo filtrables aunque el producto tenga opciones.
// Las opciones activas pueden aportar valores adicionales sin ocultar la ficha base.
export function getProductAttributeValues(
  product: ProductAttributeSource,
  attributeKey: string,
) {
  const values = [
    product.attributes[attributeKey],
    ...product.variants
      .filter((variant) => variant.isActive)
      .map((variant) => variant.attributes[attributeKey]),
  ];

  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}
