"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import type { Product, ProductCategory } from "@/types/product";
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
import { ProductFilters, type ProductFilterState } from "./product-filters";
import { ProductGrid } from "./product-grid";

interface ProductCatalogProps {
  products: Product[];
  categories: ProductCategory[];
  brands: string[];
  initialCategory?: string;
}

export function ProductCatalog({
  products,
  categories,
  brands,
  initialCategory,
}: ProductCatalogProps) {
  const maxProductPrice = Math.ceil(
    products.reduce((highest, product) => Math.max(highest, product.price), 0),
  );
  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    category: initialCategory ?? "all",
    subcategory: "all",
    brand: "all",
    availability: "all",
    maxPrice: maxProductPrice,
    sort: "featured",
  });

  const filteredProducts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !query ||
          [product.name, product.brand, product.category, product.subcategory]
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchesCategory =
          filters.category === "all" || product.categorySlug === filters.category;
        const matchesSubcategory =
          filters.subcategory === "all" ||
          product.subcategorySlug === filters.subcategory ||
          `${product.categorySlug}:${product.subcategorySlug}` ===
            filters.subcategory;
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
          matchesSubcategory &&
          matchesBrand &&
          matchesPrice &&
          matchesAvailability
        );
      })
      .sort((a, b) => {
        if (filters.sort === "price-asc") return a.price - b.price;
        if (filters.sort === "price-desc") return b.price - a.price;
        if (filters.sort === "name") return a.name.localeCompare(b.name);
        if (filters.sort === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return Number(b.isFeatured) - Number(a.isFeatured);
      });
  }, [filters, products]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <ProductFilters
          value={filters}
          onChange={setFilters}
          maxProductPrice={maxProductPrice}
          categories={categories}
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
              Filtra por categoría, marca, precio y disponibilidad.
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
                  <SheetTitle>Filtrar catálogo</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ProductFilters
                    value={filters}
                    onChange={setFilters}
                    maxProductPrice={maxProductPrice}
                    categories={categories}
                    brands={brands}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Select
              value={filters.sort}
              onValueChange={(sort) => setFilters((current) => ({ ...current, sort }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destacados</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="price-asc">Precio menor</SelectItem>
                <SelectItem value="price-desc">Precio mayor</SelectItem>
                <SelectItem value="name">Nombre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}
