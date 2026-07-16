"use client";

import { useMemo, useState } from "react";
import type { CatalogAttribute, Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utilidades";
import { getProductPricingSummary } from "@/lib/precios-producto";
import { ProductGrid } from "./cuadricula-productos";

const productsPerPage = 15;

interface PaginatedProductGridProps {
  products: Product[];
  attributes: CatalogAttribute[];
}

interface FacetDefinition {
  key: string;
  label: string;
  getValues: (product: Product) => string[];
}

function normalizedValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pageWindow = 5;
  const halfWindow = Math.floor(pageWindow / 2);
  const start = Math.max(1, Math.min(currentPage - halfWindow, totalPages - pageWindow + 1));
  const end = Math.min(totalPages, start + pageWindow - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

// Pagina y filtra las landings usando sólo atributos estructurados del catálogo.
export function PaginatedProductGrid({ products, attributes }: PaginatedProductGridProps) {
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, string[]>>({});
  const maxProductPrice = useMemo(
    () => Math.max(0, ...products.map((product) => getProductPricingSummary(product).minimumEffectivePrice)),
    [products],
  );
  const [maxPrice, setMaxPrice] = useState(maxProductPrice);
  const [onSale, setOnSale] = useState(false);
  const saleCount = useMemo(
    () => products.filter((product) => getProductPricingSummary(product).hasOffer).length,
    [products],
  );
  const facetDefinitions = useMemo<FacetDefinition[]>(
    () => [
      {
        key: "brand",
        label: "Marca",
        getValues: (product) =>
          product.brand && product.brand !== "Sin marca" ? [product.brand] : [],
      },
      ...attributes.map((attribute) => ({
        key: attribute.key,
        label: `${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ""}`,
        getValues: (product: Product) => {
          const values = product.variants.length
            ? product.variants.map((variant) => variant.attributes[attribute.key])
            : [product.attributes[attribute.key]];

          return values
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value));
        },
      })),
    ],
    [attributes],
  );
  const facets = useMemo(
    () =>
      facetDefinitions
        .map((definition) => {
          const values = new Map<string, { label: string; count: number }>();

          products.forEach((product) => {
            new Set(definition.getValues(product).map(normalizedValue)).forEach((value) => {
              const label = definition.getValues(product).find(
                (item) => normalizedValue(item) === value,
              );
              const current = values.get(value);
              values.set(value, {
                label: label ?? value,
                count: (current?.count ?? 0) + 1,
              });
            });
          });

          return {
            ...definition,
            options: [...values.entries()]
              .map(([value, option]) => ({ value, ...option }))
              .sort((first, second) => first.label.localeCompare(second.label, "es")),
          };
        })
        .filter((facet) => facet.options.length > 0),
    [facetDefinitions, products],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        facets.every((facet) => {
          const selected = selectedFeatures[facet.key] ?? [];
          if (!selected.length) return true;

          const productValues = facet.getValues(product).map(normalizedValue);
          return selected.some((value) => productValues.includes(value));
        }),
      ),
    [facets, products, selectedFeatures],
  );
  const priceFilteredProducts = useMemo(
    () => filteredProducts.filter((product) => {
      const pricing = getProductPricingSummary(product);
      return pricing.minimumEffectivePrice <= maxPrice && (!onSale || pricing.hasOffer);
    }),
    [filteredProducts, maxPrice, onSale],
  );
  const totalPages = Math.max(1, Math.ceil(priceFilteredProducts.length / productsPerPage));
  const currentPage = Math.min(selectedPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return priceFilteredProducts.slice(start, start + productsPerPage);
  }, [currentPage, priceFilteredProducts]);

  const changePage = (page: number) => {
    setSelectedPage(Math.min(Math.max(page, 1), totalPages));
    window.requestAnimationFrame(() => {
      document.getElementById("productos-disponibles")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const toggleFeature = (facetKey: string, option: string) => {
    setSelectedFeatures((current) => {
      const selected = current[facetKey] ?? [];
      const nextSelected = selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option];

      return { ...current, [facetKey]: nextSelected };
    });
    setSelectedPage(1);
  };

  const visiblePages = getVisiblePages(currentPage, totalPages);
  const visibleStart = (currentPage - 1) * productsPerPage + 1;
  const visibleEnd = Math.min(currentPage * productsPerPage, priceFilteredProducts.length);
  const priceFillPercentage =
    maxProductPrice > 0 ? Math.min(100, Math.max(0, (maxPrice / maxProductPrice) * 100)) : 0;
  const hasActiveFilters =
    Object.values(selectedFeatures).some((values) => values.length) ||
    maxPrice < maxProductPrice ||
    onSale;

  return (
    <div className={products.length ? "grid gap-8 lg:grid-cols-[minmax(250px,280px)_minmax(0,1fr)]" : undefined}>
      {products.length ? (
        <aside className="min-w-0 self-start rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-black text-dark-blue">Características</h3>
              <p className="mt-1 text-sm text-muted-foreground">Refina los productos que quieres ver.</p>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFeatures({});
                  setMaxPrice(maxProductPrice);
                  setOnSale(false);
                  setSelectedPage(1);
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Limpiar
              </button>
            ) : null}
          </div>
          <div className="mt-5 space-y-6">
            <fieldset>
              <legend className="text-sm font-black text-dark-blue">
                Precio máximo: {formatCurrency(maxPrice)}
              </legend>
              <div className="mt-3">
                <Label htmlFor="categoryMaxPrice" className="sr-only">
                  Precio máximo
                </Label>
                <input
                  id="categoryMaxPrice"
                  type="range"
                  min={0}
                  max={maxProductPrice}
                  step={1}
                  value={maxPrice}
                  className="h-3 w-full cursor-pointer appearance-none rounded-full border border-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${priceFillPercentage}%, var(--secondary) ${priceFillPercentage}%, var(--secondary) 100%)`,
                  }}
                  onChange={(event) => {
                    setMaxPrice(Number(event.target.value));
                    setSelectedPage(1);
                  }}
                />
              </div>
            </fieldset>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white/70 px-3 py-2.5">
              <Label htmlFor="categoryOnSale" className="cursor-pointer text-sm font-bold text-dark-blue">
                En oferta ({saleCount})
              </Label>
              <Switch
                id="categoryOnSale"
                checked={onSale}
                onCheckedChange={(checked) => {
                  setOnSale(checked);
                  setSelectedPage(1);
                }}
              />
            </div>
            {facets.map((facet) => (
              <fieldset key={facet.key}>
                <legend className="text-sm font-black text-dark-blue">{facet.label}</legend>
                <div className="mt-3 space-y-2">
                  {facet.options.map((option) => {
                    const checked = (selectedFeatures[facet.key] ?? []).includes(option.value);
                    const inputId = `${facet.key}-${option.value}`;

                    return (
                      <label key={option.value} htmlFor={inputId} className="grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-x-2 text-sm text-muted-foreground">
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(facet.key, option.value)}
                          className="mt-0.5 size-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="min-w-0 break-words leading-5">{option.label}</span>
                        <span className="whitespace-nowrap pt-0.5 text-xs text-muted-foreground/75">({option.count})</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {priceFilteredProducts.length ? visibleStart : 0}-{visibleEnd} de {priceFilteredProducts.length} productos.
          </p>
          {priceFilteredProducts.length > productsPerPage ? (
            <nav className="flex flex-wrap gap-2" aria-label="Paginación de productos">
              <Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
                Anterior
              </Button>
              {visiblePages.map((page) => (
                <Button key={page} type="button" variant={page === currentPage ? "default" : "outline"} size="sm" aria-current={page === currentPage ? "page" : undefined} onClick={() => changePage(page)}>
                  {page}
                </Button>
              ))}
              <Button type="button" variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>
                Siguiente
              </Button>
            </nav>
          ) : null}
        </div>
        <ProductGrid products={paginatedProducts} variant="catalog" compactPrice />
      </div>
    </div>
  );
}
