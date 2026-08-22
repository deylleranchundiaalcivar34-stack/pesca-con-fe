"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import type { CatalogAttribute, CatalogNode, Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ProductFilters,
  type ProductFilterState,
} from "./filtros-productos";
import {
  ProductPagination,
  ProductSortSelect,
} from "./controles-listado-productos";
import { ProductGrid } from "./cuadricula-productos";
import {
  readProductListingUrlState,
  sortProducts,
  writeProductListingUrlState,
  type ProductSort,
} from "@/lib/estado-listado-productos";
import { getProductPricingSummary } from "@/lib/precios-producto";
import { normalizeSearchText } from "@/lib/busqueda-productos";
import {
  buildCatalogFilterOptions,
  buildProductAttributeFacets,
  getProductFacetValues,
  type ProductFilterOption,
} from "@/lib/facetas-productos";

const productsPerPage = 15;
const defaultSort: ProductSort = "name-asc";

interface PaginatedProductGridProps {
  products: Product[];
  attributes: CatalogAttribute[];
  catalogNodes: CatalogNode[];
}

// Reutiliza el mismo estado, panel, ordenamiento y paginación del catálogo general.
export function PaginatedProductGrid({
  products,
  attributes,
  catalogNodes,
}: PaginatedProductGridProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const maxProductPrice = useMemo(
    () =>
      Math.ceil(
        products.reduce(
          (highest, product) =>
            Math.max(
              highest,
              getProductPricingSummary(product).minimumEffectivePrice,
            ),
          0,
        ),
      ),
    [products],
  );
  const urlState = useMemo(
    () =>
      readProductListingUrlState(new URLSearchParams(serializedSearchParams), {
        maximumPrice: maxProductPrice,
        defaultSort,
        allowRelevance: false,
      }),
    [maxProductPrice, serializedSearchParams],
  );
  const filters = useMemo<ProductFilterState>(
    () => ({
      search: "",
      catalogPaths: urlState.catalogPaths,
      brands: urlState.brands,
      attributes: urlState.attributes,
      maxPrice: urlState.maxPrice,
      onSale: urlState.onSale,
      sort: urlState.sort,
    }),
    [urlState],
  );
  const attributeFacets = useMemo(
    () => buildProductAttributeFacets(products, attributes, catalogNodes),
    [attributes, catalogNodes, products],
  );
  const attributeFacetByKey = useMemo(
    () => new Map(attributeFacets.map((facet) => [facet.key, facet])),
    [attributeFacets],
  );
  const brandOptions = useMemo<ProductFilterOption[]>(() => {
    const brands = new Map<string, number>();

    for (const product of products) {
      if (!product.brand || product.brand === "Sin marca") continue;
      brands.set(product.brand, (brands.get(product.brand) ?? 0) + 1);
    }

    return [...brands.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((first, second) => first.label.localeCompare(second.label, "es"));
  }, [products]);
  const categoryOptions = useMemo(
    () => buildCatalogFilterOptions(catalogNodes, products),
    [catalogNodes, products],
  );
  const saleCount = useMemo(
    () =>
      products.filter((product) => getProductPricingSummary(product).hasOffer)
        .length,
    [products],
  );
  const filteredProducts = useMemo(() => {
    const matches = products.filter((product) => {
      const productCatalogPaths = product.catalogPath
        .map((_, index) =>
          product.catalogPath
            .slice(0, index + 1)
            .map((item) => item.slug)
            .join("/"),
        );
      const matchesCatalog =
        !filters.catalogPaths.length ||
        filters.catalogPaths.some((selectedPath) =>
          productCatalogPaths.some(
            (productPath) =>
              productPath === selectedPath ||
              productPath.startsWith(`${selectedPath}/`),
          ),
        );
      const matchesBrand =
        !filters.brands.length || filters.brands.includes(product.brand);
      const matchesAttributes = Object.entries(filters.attributes).every(
        ([attributeKey, selectedValues]) => {
          if (!selectedValues.length) return true;
          const facet = attributeFacetByKey.get(attributeKey);
          if (!facet) return true;
          const productValues = getProductFacetValues(product, facet).map(
            normalizeSearchText,
          );
          return selectedValues.some((value) => productValues.includes(value));
        },
      );
      const pricing = getProductPricingSummary(product);

      return (
        matchesCatalog &&
        matchesBrand &&
        matchesAttributes &&
        pricing.minimumEffectivePrice <= filters.maxPrice &&
        (!filters.onSale || pricing.hasOffer)
      );
    });

    return sortProducts(matches, filters.sort);
  }, [attributeFacetByKey, filters, products]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  );
  const currentPage = Math.min(urlState.page, totalPages);
  const pageStart = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(
    pageStart,
    pageStart + productsPerPage,
  );
  const visibleStart = filteredProducts.length ? pageStart + 1 : 0;
  const visibleEnd = Math.min(
    pageStart + paginatedProducts.length,
    filteredProducts.length,
  );

  const getUrlState = (nextFilters: ProductFilterState, page: number) => ({
    catalogPaths: nextFilters.catalogPaths,
    brands: nextFilters.brands,
    attributes: nextFilters.attributes,
    maxPrice: nextFilters.maxPrice,
    onSale: nextFilters.onSale,
    sort: nextFilters.sort,
    page,
  });

  const updateFilters = (nextFilters: ProductFilterState) => {
    const nextParams = writeProductListingUrlState(
      searchParams,
      getUrlState(nextFilters, 1),
      { maximumPrice: maxProductPrice, defaultSort },
    );
    const query = nextParams.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  };

  const updateSort = (sort: ProductSort) => {
    updateFilters({ ...filters, sort });
  };

  const updatePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const nextParams = writeProductListingUrlState(
      searchParams,
      getUrlState(filters, nextPage),
      { maximumPrice: maxProductPrice, defaultSort, includePage: true },
    );
    const query = nextParams.toString();
    window.history.pushState(
      null,
      "",
      `${query ? `${pathname}?${query}` : pathname}#productos-disponibles`,
    );
    window.requestAnimationFrame(() => {
      document.getElementById("productos-disponibles")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const filterProps = {
    value: filters,
    onChange: updateFilters,
    maxProductPrice,
    categories: categoryOptions,
    brands: brandOptions,
    attributeFacets,
    saleCount,
  };

  return (
    <div
      className={
        products.length
          ? "grid gap-8 lg:grid-cols-[minmax(250px,280px)_minmax(0,1fr)]"
          : undefined
      }
    >
      {products.length ? (
        <aside className="hidden min-w-0 self-start lg:block">
          <ProductFilters idPrefix="clasificacion-desktop" {...filterProps} />
        </aside>
      ) : null}

      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {visibleStart}-{visibleEnd} de {filteredProducts.length} productos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter aria-hidden="true" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtrar catálogo</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ProductFilters
                    idPrefix="clasificacion-mobile"
                    {...filterProps}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <ProductSortSelect value={filters.sort} onChange={updateSort} />
          </div>
        </div>

        <ProductGrid
          products={paginatedProducts}
          variant="catalog"
          compactPrice
        />
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalProducts={filteredProducts.length}
          productsPerPage={productsPerPage}
          onPageChange={updatePage}
        />
      </div>
    </div>
  );
}
