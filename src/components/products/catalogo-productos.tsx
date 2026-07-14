"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import type { Product, ProductCategory } from "@/types/producto";
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
  type ProductFilterOption,
  type ProductFilterState,
} from "./filtros-productos";
import { ProductGrid } from "./cuadricula-productos";
import { getProductPricingSummary } from "@/lib/precios-producto";

const productsPerPage = 12;

interface ProductCatalogProps {
  products: Product[];
  categories: ProductCategory[];
  brands: string[];
}

// Coordina filtros, ordenamiento, paginacion y vista movil del catalogo.
export function ProductCatalog({
  products,
  categories,
  brands,
}: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("categoria") ?? "all";
  const searchFromUrl = searchParams.get("busqueda") ?? "";
  const saleFromUrl = searchParams.get("oferta") === "1";
  const pageFromUrl = Number(searchParams.get("pagina") ?? 1);

  return (
    <ProductCatalogInner
      key={`${categoryFromUrl}:${searchFromUrl}:${saleFromUrl}`}
      products={products}
      categories={categories}
      brands={brands}
      initialCategory={categoryFromUrl}
      initialSearch={searchFromUrl}
      initialOnSale={saleFromUrl}
      pageFromUrl={Number.isInteger(pageFromUrl) ? pageFromUrl : 1}
    />
  );
}

interface ProductCatalogInnerProps extends ProductCatalogProps {
  initialCategory: string;
  initialSearch: string;
  initialOnSale: boolean;
  pageFromUrl: number;
}

function ProductCatalogInner({
  products,
  categories,
  brands,
  initialCategory,
  initialSearch,
  initialOnSale,
  pageFromUrl,
}: ProductCatalogInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const maxProductPrice = Math.ceil(
    products.reduce(
      (highest, product) => Math.max(highest, getProductPricingSummary(product).minimumEffectivePrice),
      0,
    ),
  );
  const [filters, setFilters] = useState<ProductFilterState>({
    search: initialSearch,
    categories: initialCategory === "all" ? [] : [initialCategory],
    subcategories: [],
    brands: [],
    maxPrice: maxProductPrice,
    onSale: initialOnSale,
    sort: "name",
  });
  const [activePage, setActivePage] = useState(
    pageFromUrl >= 1 ? pageFromUrl : 1,
  );

  const filteredProducts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !query ||
          [
            product.name,
            product.brand,
            product.category,
            product.subcategory,
            ...product.catalogPath.map((item) => item.name),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        const pathSlugs = product.catalogPath.map((item) => item.slug);
        const matchesSelectedCategory = filters.categories.some(
          (category) => product.categorySlug === category || pathSlugs[0] === category,
        );
        const matchesSelectedSubcategory = filters.subcategories.some(
            (subcategory) =>
              `${product.categorySlug}/${product.subcategorySlug}` === subcategory ||
              `${pathSlugs[0]}/${pathSlugs[1]}` === subcategory,
          );
        const matchesCatalog =
          (!filters.categories.length && !filters.subcategories.length) ||
          matchesSelectedCategory ||
          matchesSelectedSubcategory;
        const matchesBrand = !filters.brands.length || filters.brands.includes(product.brand);
        const pricing = getProductPricingSummary(product);
        const matchesPrice = pricing.minimumEffectivePrice <= filters.maxPrice;
        const matchesSale = !filters.onSale || pricing.hasOffer;

        return (
          matchesSearch &&
          matchesCatalog &&
          matchesBrand &&
          matchesPrice &&
          matchesSale
        );
      })
      .sort((a, b) => {
        const aPrice = getProductPricingSummary(a).minimumEffectivePrice;
        const bPrice = getProductPricingSummary(b).minimumEffectivePrice;
        if (filters.sort === "price-asc") return aPrice - bPrice;
        if (filters.sort === "price-desc") return bPrice - aPrice;
        return a.name.localeCompare(b.name, "es");
      });
  }, [filters, products]);
  const categoryOptions = useMemo<ProductFilterOption[]>(
    () =>
      categories
        .map((category) => ({
          value: category.slug,
          label: category.name,
          count: products.filter((product) => {
            const pathSlugs = product.catalogPath.map((item) => item.slug);
            return product.categorySlug === category.slug || pathSlugs[0] === category.slug;
          }).length,
          children: category.subcategories.map((subcategory) => ({
            value: `${category.slug}/${subcategory.slug}`,
            label: subcategory.name,
            count: products.filter((product) => {
              const pathSlugs = product.catalogPath.map((item) => item.slug);
              return (
                (product.categorySlug === category.slug &&
                  product.subcategorySlug === subcategory.slug) ||
                (pathSlugs[0] === category.slug && pathSlugs[1] === subcategory.slug)
              );
            }).length,
          })),
        })),
    [categories, products],
  );
  const brandOptions = useMemo<ProductFilterOption[]>(
    () =>
      brands
        .map((brand) => ({
          value: brand,
          label: brand,
          count: products.filter((product) => product.brand === brand).length,
        }))
        .filter((brand) => brand.count > 0),
    [brands, products],
  );
  const saleCount = useMemo(
    () => products.filter((product) => getProductPricingSummary(product).hasOffer).length,
    [products],
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
  const searchTerm = filters.search.trim();

  const updatePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const nextParams = new URLSearchParams(searchParams.toString());
    setActivePage(nextPage);

    if (nextPage <= 1) {
      nextParams.delete("pagina");
    } else {
      nextParams.set("pagina", String(nextPage));
    }

    const query = nextParams.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  const resetPagination = () => {
    setActivePage(1);

    if (searchParams.has("pagina")) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("pagina");
      const query = nextParams.toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    }
  };

  const updateFilters = (nextFilters: ProductFilterState) => {
    setFilters(nextFilters);
    setActivePage(1);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("pagina");

    if (nextFilters.onSale) {
      nextParams.set("oferta", "1");
    } else {
      nextParams.delete("oferta");
    }

    const query = nextParams.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  const updateSort = (sort: string) => {
    setFilters((current) => ({ ...current, sort }));
    resetPagination();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <ProductFilters
          value={filters}
          onChange={updateFilters}
          maxProductPrice={maxProductPrice}
          categories={categoryOptions}
          brands={brandOptions}
          saleCount={saleCount}
        />
      </aside>

      <div className="min-w-0">
        {searchTerm ? (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-dark-blue">
              Resultados para <span className="font-bold">“{searchTerm}”</span>
            </p>
            <Link
              href="/productos"
              className="w-fit text-sm font-semibold text-primary underline-offset-4 transition hover:text-dark-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver todos los productos
            </Link>
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
                    value={filters}
                    onChange={updateFilters}
                    maxProductPrice={maxProductPrice}
                    categories={categoryOptions}
                    brands={brandOptions}
                    saleCount={saleCount}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <select
              value={filters.sort}
              onChange={(event) => updateSort(event.target.value)}
              className="h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Ordenar productos"
            >
              <option value="name">Nombre A-Z</option>
              <option value="price-asc">Precio menor</option>
              <option value="price-desc">Precio mayor</option>
            </select>
          </div>
        </div>

        <ProductGrid products={paginatedProducts} compactPrice />
        <CatalogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalProducts={filteredProducts.length}
          onPageChange={updatePage}
        />
      </div>
    </div>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pageWindow = 5;
  const halfWindow = Math.floor(pageWindow / 2);
  const start = Math.max(1, Math.min(currentPage - halfWindow, totalPages - pageWindow + 1));
  const end = Math.min(totalPages, start + pageWindow - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function CatalogPagination({
  currentPage,
  totalPages,
  totalProducts,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  onPageChange: (page: number) => void;
}) {
  if (totalProducts <= productsPerPage) {
    return null;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      className="mt-8 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginacion de productos"
    >
      <p className="text-sm text-muted-foreground">
        Pagina {currentPage} de {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </Button>
        {visiblePages.map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
