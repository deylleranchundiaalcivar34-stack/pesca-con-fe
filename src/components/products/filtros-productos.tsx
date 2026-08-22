"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProductSort } from "@/lib/estado-listado-productos";
import type {
  ProductAttributeFilterFacet,
  ProductFilterOption,
} from "@/lib/facetas-productos";
import { formatCurrency } from "@/lib/utilidades";

export interface ProductFilterState {
  search: string;
  catalogPaths: string[];
  brands: string[];
  attributes: Record<string, string[]>;
  maxPrice: number;
  onSale: boolean;
  sort: ProductSort;
}

interface ProductFiltersProps {
  idPrefix: string;
  value: ProductFilterState;
  onChange: (value: ProductFilterState) => void;
  maxProductPrice: number;
  categories: ProductFilterOption[];
  brands: ProductFilterOption[];
  attributeFacets: ProductAttributeFilterFacet[];
  saleCount: number;
  highlightCatalogMatches?: boolean;
}

function getInitiallyExpandedPaths(
  options: ProductFilterOption[],
  selectedPaths: string[],
  expandMatchedBranches: boolean,
) {
  const expanded = new Set<string>();

  function visit(option: ProductFilterOption) {
    if (option.children?.length && (
      selectedPaths.some((selected) => selected.startsWith(`${option.value}/`)) ||
      (expandMatchedBranches && option.count > 0)
    )) {
      expanded.add(option.value);
    }
    option.children?.forEach(visit);
  }

  options.forEach(visit);
  return [...expanded];
}

// Mantiene el lenguaje visual existente y expone toda la jerarquía del catálogo.
export function ProductFilters({
  idPrefix,
  value,
  onChange,
  maxProductPrice,
  categories,
  brands,
  attributeFacets,
  saleCount,
  highlightCatalogMatches = false,
}: ProductFiltersProps) {
  const priceFillPercentage =
    maxProductPrice > 0
      ? Math.min(100, Math.max(0, (value.maxPrice / maxProductPrice) * 100))
      : 0;
  const hasActiveFilters =
    value.catalogPaths.length > 0 ||
    value.brands.length > 0 ||
    Object.values(value.attributes).some((values) => values.length > 0) ||
    value.onSale ||
    value.maxPrice < maxProductPrice;

  const toggleOption = (key: "catalogPaths" | "brands", option: string) => {
    const selected = value[key];
    onChange({
      ...value,
      [key]: selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    });
  };

  const toggleAttribute = (attributeKey: string, option: string) => {
    const selected = value.attributes[attributeKey] ?? [];
    const nextSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    onChange({
      ...value,
      attributes: { ...value.attributes, [attributeKey]: nextSelected },
    });
  };

  const clearFilters = () =>
    onChange({
      search: value.search,
      catalogPaths: [],
      brands: [],
      attributes: {},
      maxPrice: maxProductPrice,
      onSale: false,
      sort: value.sort,
    });

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-dark-blue">Filtros</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Refina los productos que quieres ver.
          </p>
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
            <Label htmlFor={`${idPrefix}-maxPrice`} className="sr-only">
              Precio máximo
            </Label>
            <input
              id={`${idPrefix}-maxPrice`}
              type="range"
              min={0}
              max={maxProductPrice}
              step={1}
              value={value.maxPrice}
              className="h-3 w-full cursor-pointer appearance-none rounded-full border border-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${priceFillPercentage}%, var(--secondary) ${priceFillPercentage}%, var(--secondary) 100%)`,
              }}
              onChange={(event) =>
                onChange({ ...value, maxPrice: Number(event.target.value) })
              }
            />
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white/70 px-3 py-2.5">
          <Label
            htmlFor={`${idPrefix}-onSale`}
            className="cursor-pointer text-sm font-bold text-dark-blue"
          >
            En oferta ({saleCount})
          </Label>
          <Switch
            id={`${idPrefix}-onSale`}
            checked={value.onSale}
            onCheckedChange={(checked) => onChange({ ...value, onSale: checked })}
          />
        </div>

        <CategoryFilterGroup
          idPrefix={idPrefix}
          options={categories}
          selected={value.catalogPaths}
          highlightMatches={highlightCatalogMatches}
          onToggle={(option) => toggleOption("catalogPaths", option)}
        />
        {attributeFacets.map((facet) => (
          <FilterCheckboxGroup
            key={facet.key}
            idPrefix={`${idPrefix}-atributo-${facet.key}`}
            label={facet.label}
            options={facet.options}
            selected={value.attributes[facet.key] ?? []}
            onToggle={(option) => toggleAttribute(facet.key, option)}
          />
        ))}
        <FilterCheckboxGroup
          idPrefix={`${idPrefix}-marca`}
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
  idPrefix,
  label,
  options,
  selected,
  onToggle,
}: {
  idPrefix: string;
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
          const inputId = `${idPrefix}-${option.value}`;

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
  idPrefix,
  options,
  selected,
  highlightMatches,
  onToggle,
}: {
  idPrefix: string;
  options: ProductFilterOption[];
  selected: string[];
  highlightMatches: boolean;
  onToggle: (value: string) => void;
}) {
  const [expandedPaths, setExpandedPaths] = useState<string[]>(() =>
    getInitiallyExpandedPaths(options, selected, true),
  );

  const toggleExpanded = (path: string) => {
    setExpandedPaths((current) =>
      current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path],
    );
  };

  if (!options.length) return null;

  return (
    <fieldset>
      <legend className="text-sm font-black text-dark-blue">Catálogo</legend>
      <div className="mt-3 space-y-2">
        {options.map((option) => (
          <CatalogFilterOption
            key={option.value}
            idPrefix={idPrefix}
            option={option}
            selected={selected}
            highlightMatches={highlightMatches}
            expandedPaths={expandedPaths}
            depth={0}
            onToggle={onToggle}
            onToggleExpanded={toggleExpanded}
          />
        ))}
      </div>
    </fieldset>
  );
}

function CatalogFilterOption({
  idPrefix,
  option,
  selected,
  highlightMatches,
  expandedPaths,
  depth,
  onToggle,
  onToggleExpanded,
}: {
  idPrefix: string;
  option: ProductFilterOption;
  selected: string[];
  highlightMatches: boolean;
  expandedPaths: string[];
  depth: number;
  onToggle: (value: string) => void;
  onToggleExpanded: (value: string) => void;
}) {
  const inputId = `${idPrefix}-catalogo-${option.value}`;
  const isExpanded = expandedPaths.includes(option.value);
  const hasChildren = Boolean(option.children?.length);
  const isSelected = selected.includes(option.value);
  const isSearchMatch = highlightMatches && option.count > 0;
  const isUnavailable = option.count === 0 && !isSelected;

  return (
    <div>
      <div
        className={`grid grid-cols-[1rem_minmax(0,1fr)_auto_auto] items-start gap-x-2 rounded-md py-0.5 text-sm transition-colors ${
          isSearchMatch ? "bg-primary/[0.07] text-dark-blue" : "text-muted-foreground"
        } ${isUnavailable ? "opacity-55" : ""}`}
        style={depth ? { marginLeft: `${Math.min(depth, 3)}rem` } : undefined}
      >
        <input
          id={inputId}
          type="checkbox"
          checked={isSelected}
          disabled={isUnavailable}
          onChange={() => onToggle(option.value)}
          className="mt-0.5 size-4 rounded border-border text-primary focus:ring-ring disabled:cursor-not-allowed"
        />
        <label
          htmlFor={inputId}
          className={`min-w-0 break-words leading-5 ${
            isUnavailable ? "cursor-not-allowed" : "cursor-pointer"
          } ${isSearchMatch ? "font-semibold" : ""}`}
        >
          {option.label}
        </label>
        <span className="whitespace-nowrap pt-0.5 text-xs text-muted-foreground/75">
          ({option.count})
        </span>
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} clasificaciones de ${option.label}`}
            aria-expanded={isExpanded}
            onClick={() => onToggleExpanded(option.value)}
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

      {isExpanded && option.children?.length ? (
        <div className="mt-2 space-y-2 border-l border-border/70">
          {option.children.map((child) => (
            <CatalogFilterOption
              key={child.value}
              idPrefix={idPrefix}
              option={child}
              selected={selected}
              highlightMatches={highlightMatches}
              expandedPaths={expandedPaths}
              depth={depth + 1}
              onToggle={onToggle}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
