"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utilidades";

export interface ProductFilterState {
  search: string;
  categories: string[];
  subcategories: string[];
  brands: string[];
  maxPrice: number;
  onSale: boolean;
  sort: string;
}

export interface ProductFilterOption {
  value: string;
  label: string;
  count: number;
  children?: ProductFilterOption[];
}

interface ProductFiltersProps {
  value: ProductFilterState;
  onChange: (value: ProductFilterState) => void;
  maxProductPrice: number;
  categories: ProductFilterOption[];
  brands: ProductFilterOption[];
  saleCount: number;
}

// Mantiene el mismo lenguaje visual de los filtros de las páginas de categoría.
export function ProductFilters({
  value,
  onChange,
  maxProductPrice,
  categories,
  brands,
  saleCount,
}: ProductFiltersProps) {
  const priceFillPercentage =
    maxProductPrice > 0
      ? Math.min(100, Math.max(0, (value.maxPrice / maxProductPrice) * 100))
      : 0;
  const hasActiveFilters =
    value.categories.length > 0 ||
    value.subcategories.length > 0 ||
    value.brands.length > 0 ||
    value.onSale ||
    value.maxPrice < maxProductPrice;

  const toggleOption = (key: "categories" | "subcategories" | "brands", option: string) => {
    const selected = value[key];
    onChange({
      ...value,
      [key]: selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    });
  };

  const clearFilters = () =>
    onChange({
      search: value.search,
      categories: [],
      subcategories: [],
      brands: [],
      maxPrice: maxProductPrice,
      onSale: false,
      sort: value.sort,
    });

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-dark-blue">Filtros</h3>
          <p className="mt-1 text-sm text-muted-foreground">Refina los productos que quieres ver.</p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 text-xs font-bold text-primary hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-6">
        <fieldset>
          <legend className="text-sm font-black text-dark-blue">
            Precio máximo: {formatCurrency(value.maxPrice)}
          </legend>
          <div className="mt-3">
            <Label htmlFor="maxPrice" className="sr-only">
              Precio máximo
            </Label>
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
              onChange={(event) => onChange({ ...value, maxPrice: Number(event.target.value) })}
            />
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white/70 px-3 py-2.5">
          <Label htmlFor="onSale" className="cursor-pointer text-sm font-bold text-dark-blue">
            En oferta ({saleCount})
          </Label>
          <Switch
            id="onSale"
            checked={value.onSale}
            onCheckedChange={(checked) => onChange({ ...value, onSale: checked })}
          />
        </div>

        <CategoryFilterGroup
          options={categories}
          selectedCategories={value.categories}
          selectedSubcategories={value.subcategories}
          onToggleCategory={(option) => toggleOption("categories", option)}
          onToggleSubcategory={(option) => toggleOption("subcategories", option)}
        />
        <FilterCheckboxGroup
          label="Marca"
          options={brands}
          selected={value.brands}
          onToggle={(option) => toggleOption("brands", option)}
        />
      </div>
    </div>
  );
}

function FilterCheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: ProductFilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (!options.length) return null;

  return (
    <fieldset>
      <legend className="text-sm font-black text-dark-blue">{label}</legend>
      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const inputId = `${label}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-x-2 text-sm text-muted-foreground"
            >
              <input
                id={inputId}
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="min-w-0 break-words leading-5">{option.label}</span>
              <span className="whitespace-nowrap pt-0.5 text-xs text-muted-foreground/75">
                ({option.count})
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CategoryFilterGroup({
  options,
  selectedCategories,
  selectedSubcategories,
  onToggleCategory,
  onToggleSubcategory,
}: {
  options: ProductFilterOption[];
  selectedCategories: string[];
  selectedSubcategories: string[];
  onToggleCategory: (value: string) => void;
  onToggleSubcategory: (value: string) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleExpanded = (category: string) => {
    setExpandedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  return (
    <fieldset>
      <legend className="text-sm font-black text-dark-blue">Categoría</legend>
      <div className="mt-3 space-y-2">
        {options.map((category) => {
          const categoryId = `categoria-${category.value}`;
          const isExpanded = expandedCategories.includes(category.value);
          const hasChildren = Boolean(category.children?.length);

          return (
            <div key={category.value}>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)_auto_auto] items-start gap-x-2 text-sm text-muted-foreground">
                <input
                  id={categoryId}
                  type="checkbox"
                  checked={selectedCategories.includes(category.value)}
                  onChange={() => onToggleCategory(category.value)}
                  className="mt-0.5 size-4 rounded border-border text-primary focus:ring-ring"
                />
                <label htmlFor={categoryId} className="min-w-0 cursor-pointer break-words leading-5">
                  {category.label}
                </label>
                <span className="whitespace-nowrap pt-0.5 text-xs text-muted-foreground/75">
                  ({category.count})
                </span>
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} clasificaciones de ${category.label}`}
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpanded(category.value)}
                    className="-mt-0.5 grid size-5 place-items-center rounded text-primary hover:bg-primary/10"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <span className="size-5" />
                )}
              </div>

              {isExpanded && category.children?.length ? (
                <div className="mt-2 ml-2 space-y-2 border-l border-border pl-4">
                  {category.children.map((subcategory) => {
                    const inputId = `subcategoria-${subcategory.value}`;

                    return (
                      <label
                        key={subcategory.value}
                        htmlFor={inputId}
                        className="grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-x-2 text-sm text-muted-foreground"
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={selectedSubcategories.includes(subcategory.value)}
                          onChange={() => onToggleSubcategory(subcategory.value)}
                          className="mt-0.5 size-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="min-w-0 break-words leading-5">{subcategory.label}</span>
                        <span className="whitespace-nowrap pt-0.5 text-xs text-muted-foreground/75">
                          ({subcategory.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
