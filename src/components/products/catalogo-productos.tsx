"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import type { CatalogNode, Product, ProductCategory } from "@/types/producto";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductFilters, type ProductFilterState } from "./filtros-productos";
import { ProductGrid } from "./cuadricula-productos";

const productsPerPage = 12;

interface ProductCatalogProps {
  products: Product[];
  categories: ProductCategory[];
  catalogNodes: CatalogNode[];
  brands: string[];
}

// Coordina filtros, ordenamiento, paginacion y vista movil del catalogo.
export function ProductCatalog({
  products,
  categories,
  catalogNodes,
  brands,
}: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("categoria") ?? "all";
  const classificationFromUrl = searchParams.get("clasificacion") ?? "all";
  const subclassificationFromUrl = searchParams.get("subclasificacion") ?? "all";
  const productTypeFromUrl = searchParams.get("tipo") ?? "all";
  const searchFromUrl = searchParams.get("busqueda") ?? "";
  const pageFromUrl = Number(searchParams.get("pagina") ?? 1);

  return (
    <ProductCatalogInner
      key={`${categoryFromUrl}:${classificationFromUrl}:${subclassificationFromUrl}:${productTypeFromUrl}:${searchFromUrl}`}
      products={products}
      categories={categories}
      catalogNodes={catalogNodes}
      brands={brands}
      initialCategory={categoryFromUrl}
      initialClassification={classificationFromUrl}
      initialSubclassification={subclassificationFromUrl}
      initialProductType={productTypeFromUrl}
      initialSearch={searchFromUrl}
      pageFromUrl={Number.isInteger(pageFromUrl) ? pageFromUrl : 1}
    />
  );
}

interface ProductCatalogInnerProps extends ProductCatalogProps {
  initialCategory: string;
  initialClassification: string;
  initialSubclassification: string;
  initialProductType: string;
  initialSearch: string;
  pageFromUrl: number;
}

function ProductCatalogInner({
  products,
  categories,
  catalogNodes,
  brands,
  initialCategory,
  initialClassification,
  initialSubclassification,
  initialProductType,
  initialSearch,
  pageFromUrl,
}: ProductCatalogInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const maxProductPrice = Math.ceil(
    products.reduce((highest, product) => Math.max(highest, product.price), 0),
  );
  const [filters, setFilters] = useState<ProductFilterState>({
    search: initialSearch,
    category: initialCategory,
    classification: initialClassification,
    subclassification: initialSubclassification,
    productType: initialProductType,
    brand: "all",
    availability: "all",
    maxPrice: maxProductPrice,
    sort: "featured",
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
        const matchesCategory =
          filters.category === "all" ||
          product.categorySlug === filters.category ||
          pathSlugs[0] === filters.category;
        const matchesClassification =
          filters.classification === "all" ||
          product.subcategorySlug === filters.classification ||
          pathSlugs[1] === filters.classification;
        const matchesSubclassification =
          filters.subclassification === "all" || pathSlugs[2] === filters.subclassification;
        const matchesProductType =
          filters.productType === "all" || pathSlugs[3] === filters.productType;
        const matchesBrand = filters.brand === "all" || product.brand === filters.brand;
        const matchesPrice = product.price <= filters.maxPrice;
        const matchesAvailability =
          filters.availability === "all" ||
          (filters.availability === "in-stock" && product.stock > 3) ||
          (filters.availability === "low-stock" &&
            product.stock > 0 &&
            product.stock <= 3) ||
          (filters.availability === "out-of-stock" && product.stock === 0);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesClassification &&
          matchesSubclassification &&
          matchesProductType &&
          matchesBrand &&
          matchesPrice &&
          matchesAvailability
        );
      })
      .sort((a, b) => {
        if (filters.sort === "price-asc") return a.price - b.price;
        if (filters.sort === "price-desc") return b.price - a.price;
        if (filters.sort === "name") return a.name.localeCompare(b.name);
        return Number(b.isFeatured) - Number(a.isFeatured);
      });
  }, [filters, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const currentPage = activePage >= 1 && activePage <= totalPages ? activePage : 1;
  const pageStartIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + productsPerPage,
  );
  const visibleStart = filteredProducts.length ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(pageStartIndex + paginatedProducts.length, filteredProducts.length);

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
    resetPagination();
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
          categories={categories}
          catalogNodes={catalogNodes}
          brands={brands}
        />
      </aside>

      <div className="min-w-0">
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
                    categories={categories}
                    catalogNodes={catalogNodes}
                    brands={brands}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Select value={filters.sort} onValueChange={updateSort}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destacados</SelectItem>
                <SelectItem value="price-asc">Precio menor</SelectItem>
                <SelectItem value="price-desc">Precio mayor</SelectItem>
                <SelectItem value="name">Nombre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ProductGrid products={paginatedProducts} />
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
