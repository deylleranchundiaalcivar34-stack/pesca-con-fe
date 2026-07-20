type CatalogCategorySlug = {
  slug: string;
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
