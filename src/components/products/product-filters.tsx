"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductAvailability, ProductCategory } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

export interface ProductFilterState {
  search: string;
  category: string;
  subcategory: string;
  brand: string;
  availability: ProductAvailability;
  maxPrice: number;
  sort: string;
}

interface ProductFiltersProps {
  value: ProductFilterState;
  onChange: (value: ProductFilterState) => void;
  maxProductPrice: number;
  categories: ProductCategory[];
  brands: string[];
}

export function ProductFilters({
  value,
  onChange,
  maxProductPrice,
  categories,
  brands,
}: ProductFiltersProps) {
  const currentCategory = categories.find(
    (category) => category.slug === value.category,
  );
  const subcategories = currentCategory
    ? currentCategory.subcategories.map((subcategory) => ({
        ...subcategory,
        label: subcategory.name,
        value: subcategory.slug,
      }))
    : categories.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          ...subcategory,
          label: `${category.name} · ${subcategory.name}`,
          value: `${category.slug}:${subcategory.slug}`,
        })),
      );

  const update = <K extends keyof ProductFilterState>(
    key: K,
    nextValue: ProductFilterState[K],
  ) => {
    onChange({
      ...value,
      [key]: nextValue,
      ...(key === "category" ? { subcategory: "all" } : {}),
    });
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-dark-blue">Filtros</p>
          <p className="text-xs text-muted-foreground">
            Encuentra el equipo ideal.
          </p>
        </div>
        <SlidersHorizontal className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="search">Buscar producto</Label>
        <Input
          id="search"
          value={value.search}
          placeholder="Carrete, caña, Rapala..."
          onChange={(event) => update("search", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={value.category} onValueChange={(next) => update("category", next)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Subcategoría</Label>
        <Select
          value={value.subcategory}
          onValueChange={(next) => update("subcategory", next)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {subcategories.map((subcategory) => (
              <SelectItem key={subcategory.value} value={subcategory.value}>
                {subcategory.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Marca</Label>
        <Select value={value.brand} onValueChange={(next) => update("brand", next)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxPrice">Precio máximo: {formatCurrency(value.maxPrice)}</Label>
        <Input
          id="maxPrice"
          type="range"
          min={0}
          max={maxProductPrice}
          step={1}
          value={value.maxPrice}
          onChange={(event) => update("maxPrice", Number(event.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Disponibilidad</Label>
        <Select
          value={value.availability}
          onValueChange={(next) => update("availability", next as ProductAvailability)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in-stock">En stock</SelectItem>
            <SelectItem value="low-stock">Bajo stock</SelectItem>
            <SelectItem value="out-of-stock">Agotados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          onChange({
            search: "",
            category: "all",
            subcategory: "all",
            brand: "all",
            availability: "all",
            maxPrice: maxProductPrice,
            sort: value.sort,
          })
        }
      >
        Limpiar filtros
      </Button>
    </div>
  );
}
