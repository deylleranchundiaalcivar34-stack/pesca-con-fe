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
import type { ProductAvailability, ProductCategory } from "@/types/producto";
import { formatCurrency } from "@/lib/utilidades";

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

// Panel reutilizable de filtros para catalogo desktop y movil.
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
  const priceFillPercentage =
    maxProductPrice > 0
      ? Math.min(100, Math.max(0, (value.maxPrice / maxProductPrice) * 100))
      : 0;

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
        <input
          id="maxPrice"
          type="range"
          min={0}
          max={maxProductPrice}
          step={1}
          value={value.maxPrice}
          className="h-3 w-full cursor-pointer appearance-none rounded-full border border-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${priceFillPercentage}%, var(--secondary) ${priceFillPercentage}%, var(--secondary) 100%)`,
          }}
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
