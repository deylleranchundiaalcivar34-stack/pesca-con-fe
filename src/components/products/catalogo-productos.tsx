"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import type {
  CatalogAttribute,
  CatalogNode,
  Product,
  ProductCategory,
} from "@/types/producto";
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
import { ProductGrid } from "./cuadricula-productos";
import { FullCatalogLink } from "./enlace-catalogo-completo";
import {
  ProductPagination,
  ProductSortSelect,
} from "./controles-listado-productos";
import {
  getProductCatalogPathKeys,
  getRelatedSearchSuggestions,
  normalizeSearchText,
  rankProductsForSearch,
} from "@/lib/busqueda-productos";
import {
  readProductListingUrlState,
  sortProducts,
  writeProductListingUrlState,
  type ProductSort,
} from "@/lib/estado-listado-productos";
import { getProductPricingSummary } from "@/lib/precios-producto";
import {
  getValidCatalogCategory,
} from "@/lib/filtros-catalogo";
import {
  buildCatalogFilterOptions,
  buildProductAttributeFacets,
  getProductFacetValues,
  type ProductFilterOption,
} from "@/lib/facetas-productos";

const productsPerPage = 12;

interface ProductCatalogProps {
  products: Product[];
  categories: ProductCategory[];
  brands: string[];
  catalogAttributes: CatalogAttribute[];
  catalogNodes: CatalogNode[];
}

// Coordina filtros, ordenamiento, paginacion y vista movil del catalogo.
export function ProductCatalog({
  products,
  categories,
  brands,
  catalogAttributes,
  catalogNodes,
}: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const categoryFromUrl = getValidCatalogCategory(
    searchParams.get("categoria"),
    categories,
  );
  const searchFromUrl = searchParams.get("busqueda") ?? "";

  return (
    <ProductCatalogInner
      key={searchParams.toString()}
      products={products}
      categories={categories}
      brands={brands}
      catalogAttributes={catalogAttributes}
      catalogNodes={catalogNodes}
      initialCategory={categoryFromUrl}
      initialSearch={searchFromUrl}
    />
  );
}
interface ProductCatalogInnerProps extends ProductCatalogProps {
  initialCategory: string;
  initialSearch: string;
}

function ProductCatalogInner({
  products,
  brands,
  initialCategory,
  initialSearch,
  catalogAttributes,
  catalogNodes,
}: ProductCatalogInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = initialSearch.trim();
  const rankedSearchResults = useMemo(
    () => rankProductsForSearch(searchTerm, products),
    [products, searchTerm],
  );
  const searchScopeProducts = useMemo(
    () => rankedSearchResults.map(({ product }) => product),
    [rankedSearchResults],
  );
  const rankByProductId = useMemo(
    () => new Map(rankedSearchResults.map(({ product, rank }) => [product.id, rank])),
    [rankedSearchResults],
  );
  const maxProductPrice = Math.ceil(
    searchScopeProducts.reduce(
      (highest, product) => Math.max(highest, getProductPricingSummary(product).minimumEffectivePrice),
      0,
    ),
  );
  const defaultSort: ProductSort = searchTerm ? "relevance" : "name-asc";
  const initialUrlState = readProductListingUrlState(searchParams, {
    maximumPrice: maxProductPrice,
    defaultSort,
    allowRelevance: Boolean(searchTerm),
    fallbackCatalogPaths:
      initialCategory === "all" ? [] : [initialCategory],
  });
  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    search: initialSearch,
    catalogPaths: initialUrlState.catalogPaths,
    brands: initialUrlState.brands,
    attributes: initialUrlState.attributes,
    maxPrice: initialUrlState.maxPrice,
    onSale: initialUrlState.onSale,
    sort: initialUrlState.sort,
  }));
  const [activePage, setActivePage] = useState(initialUrlState.page);
  const categoryOptions = useMemo<ProductFilterOption[]>(
    () => buildCatalogFilterOptions(catalogNodes, searchScopeProducts),
    [catalogNodes, searchScopeProducts],
  );
  const attributeFacets = useMemo(
    () =>
      buildProductAttributeFacets(
        searchScopeProducts,
        catalogAttributes,
        catalogNodes,
      ),
    [catalogAttributes, catalogNodes, searchScopeProducts],
  );
  const attributeFacetByKey = useMemo(
    () => new Map(attributeFacets.map((facet) => [facet.key, facet])),
    [attributeFacets],
  );

  const filteredProducts = useMemo(() => {
    const matches = searchScopeProducts.filter((product) => {
        const productCatalogPaths = getProductCatalogPathKeys(product);
        const matchesCatalog =
          !filters.catalogPaths.length ||
          filters.catalogPaths.some((selectedPath) =>
            productCatalogPaths.some(
              (productPath) =>
                productPath === selectedPath ||
                productPath.startsWith(`${selectedPath}/`),
            ),
          );
        const matchesBrand = !filters.brands.length || filters.brands.includes(product.brand);
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
        const matchesPrice = pricing.minimumEffectivePrice <= filters.maxPrice;
        const matchesSale = !filters.onSale || pricing.hasOffer;

        return (
          matchesCatalog &&
          matchesBrand &&
          matchesAttributes &&
          matchesPrice &&
          matchesSale
        );
      });

    return sortProducts(matches, filters.sort, rankByProductId);
  }, [attributeFacetByKey, filters, rankByProductId, searchScopeProducts]);
  const relatedSuggestions = useMemo(
    () =>
      searchTerm && !searchScopeProducts.length
        ? getRelatedSearchSuggestions(searchTerm, products)
        : [],
    [products, searchScopeProducts.length, searchTerm],
  );
  const brandOptions = useMemo<ProductFilterOption[]>(
    () =>
      brands
        .map((brand) => ({
          value: brand,
          label: brand,
          count: searchScopeProducts.filter((product) => product.brand === brand).length,
        }))
        .filter((brand) => brand.count > 0),
    [brands, searchScopeProducts],
  );
  const saleCount = useMemo(
    () => searchScopeProducts.filter((product) => getProductPricingSummary(product).hasOffer).length,
    [searchScopeProducts],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const currentPage = activePage >= 1 && activePage <= totalPages ? activePage : 1;
  const pageStartIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + productsPerPage,
  );
  const visibleStart = filteredProducts.length ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(pageStartIndex + paginatedProducts.length, filteredProducts.length);
  const getUrlState = (nextFilters: ProductFilterState, page: number) => ({
    catalogPaths: nextFilters.catalogPaths,
    brands: nextFilters.brands,
    attributes: nextFilters.attributes,
    maxPrice: nextFilters.maxPrice,
    onSale: nextFilters.onSale,
    sort: nextFilters.sort,
    page,
  });
  const updatePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const nextParams = writeProductListingUrlState(
      searchParams,
      getUrlState(filters, nextPage),
      { maximumPrice: maxProductPrice, defaultSort, includePage: true },
    );
    setActivePage(nextPage);
    const query = nextParams.toString();
    window.history.pushState(
      null,
      "",
      `${query ? `${pathname}?${query}` : pathname}#catalogo-resultados`,
    );
    window.requestAnimationFrame(() => {
      document.getElementById("catalogo-resultados")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const updateFilters = (nextFilters: ProductFilterState) => {
    setFilters(nextFilters);
    setActivePage(1);
    const nextParams = writeProductListingUrlState(
      searchParams,
      getUrlState(nextFilters, 1),
      { maximumPrice: maxProductPrice, defaultSort },
    );
    const query = nextParams.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  const updateSort = (sort: ProductSort) => {
    const nextFilters = { ...filters, sort };
    setFilters(nextFilters);
    setActivePage(1);
    const nextParams = writeProductListingUrlState(
      searchParams,
      getUrlState(nextFilters, 1),
      { maximumPrice: maxProductPrice, defaultSort },
    );
    const query = nextParams.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <ProductFilters
          idPrefix="catalogo-desktop"
          value={filters}
          onChange={updateFilters}
          maxProductPrice={maxProductPrice}
          categories={categoryOptions}
          brands={brandOptions}
          attributeFacets={attributeFacets}
          saleCount={saleCount}
          highlightCatalogMatches={Boolean(searchTerm)}
        />
      </aside>

      <div id="catalogo-resultados" className="min-w-0 scroll-mt-24">
        {searchTerm ? (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-dark-blue">
              Resultados para <span className="font-bold">“{searchTerm}”</span>
            </p>
            <FullCatalogLink
              className="w-fit text-sm font-semibold text-primary underline-offset-4 transition hover:text-dark-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver todos los productos
            </FullCatalogLink>
          </div>
        ) : null}
        {relatedSuggestions.length ? (
          <div className="mb-4 rounded-lg border border-primary/20 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-dark-blue">
              No encontramos coincidencias para “{searchTerm}” en el catálogo.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quizás buscabas:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedSuggestions.map((suggestion) => (
                <Link
                  key={suggestion.href}
                  href={suggestion.href}
                  className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {suggestion.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-dark-blue">
              {filteredProducts.length} productos encontrados
            </p>
            <p className="text-sm text-muted-foreground">
              Mostrando {visibleStart}-{visibleEnd} de {filteredProducts.length} productos.
            </p>
          </div>

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter aria-hidden="true" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtrar catalogo</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ProductFilters
                    idPrefix="catalogo-mobile"
                    value={filters}
                    onChange={updateFilters}
                    maxProductPrice={maxProductPrice}
                    categories={categoryOptions}
                    brands={brandOptions}
                    attributeFacets={attributeFacets}
                    saleCount={saleCount}
                    highlightCatalogMatches={Boolean(searchTerm)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <ProductSortSelect
              value={filters.sort}
              onChange={updateSort}
              includeRelevance={Boolean(searchTerm)}
            />
          </div>
        </div>

        <ProductGrid products={paginatedProducts} compactPrice />
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
