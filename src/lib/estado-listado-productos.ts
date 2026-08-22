import type { Product } from "@/types/producto";
import { getProductPricingSummary } from "@/lib/precios-producto";

export type ProductSort =
  | "relevance"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

export interface ProductListingUrlState {
  catalogPaths: string[];
  brands: string[];
  attributes: Record<string, string[]>;
  maxPrice: number;
  onSale: boolean;
  sort: ProductSort;
  page: number;
}

interface SearchParamsReader {
  get(name: string): string | null;
  getAll(name: string): string[];
  forEach(callback: (value: string, key: string) => void): void;
  toString(): string;
}

const validSorts = new Set<ProductSort>([
  "relevance",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
]);

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

function getBoundedPrice(value: string | null, maximumPrice: number) {
  if (!value) return maximumPrice;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return maximumPrice;
  return Math.min(maximumPrice, Math.max(0, parsed));
}

export function getProductSort(
  value: string | null,
  defaultSort: ProductSort,
  allowRelevance: boolean,
) {
  if (!value || !validSorts.has(value as ProductSort)) return defaultSort;
  if (value === "relevance" && !allowRelevance) return defaultSort;
  return value as ProductSort;
}

export function readProductListingUrlState(
  searchParams: SearchParamsReader,
  options: {
    maximumPrice: number;
    defaultSort: ProductSort;
    allowRelevance: boolean;
    fallbackCatalogPaths?: string[];
  },
): ProductListingUrlState {
  const attributes: Record<string, string[]> = {};

  searchParams.forEach((value, key) => {
    if (!key.startsWith("filtro_")) return;
    const attributeKey = key.slice("filtro_".length).trim();
    if (!attributeKey) return;
    attributes[attributeKey] = uniqueValues([
      ...(attributes[attributeKey] ?? []),
      value,
    ]);
  });

  const catalogPaths = uniqueValues(searchParams.getAll("catalogo"));

  return {
    catalogPaths: catalogPaths.length
      ? catalogPaths
      : uniqueValues(options.fallbackCatalogPaths ?? []),
    brands: uniqueValues(searchParams.getAll("marca")),
    attributes,
    maxPrice: getBoundedPrice(
      searchParams.get("precio"),
      options.maximumPrice,
    ),
    onSale: searchParams.get("oferta") === "1",
    sort: getProductSort(
      searchParams.get("orden"),
      options.defaultSort,
      options.allowRelevance,
    ),
    page: getPositiveInteger(searchParams.get("pagina"), 1),
  };
}

export function writeProductListingUrlState(
  searchParams: SearchParamsReader,
  state: ProductListingUrlState,
  options: {
    maximumPrice: number;
    defaultSort: ProductSort;
    includePage?: boolean;
  },
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.delete("categoria");
  nextParams.delete("catalogo");
  nextParams.delete("marca");
  nextParams.delete("precio");
  nextParams.delete("oferta");
  nextParams.delete("orden");
  nextParams.delete("pagina");
  [...nextParams.keys()]
    .filter((key) => key.startsWith("filtro_"))
    .forEach((key) => nextParams.delete(key));

  uniqueValues(state.catalogPaths).forEach((path) =>
    nextParams.append("catalogo", path),
  );
  uniqueValues(state.brands).forEach((brand) =>
    nextParams.append("marca", brand),
  );
  Object.entries(state.attributes).forEach(([attributeKey, values]) => {
    uniqueValues(values).forEach((value) =>
      nextParams.append(`filtro_${attributeKey}`, value),
    );
  });

  if (state.maxPrice < options.maximumPrice) {
    nextParams.set("precio", String(state.maxPrice));
  }
  if (state.onSale) nextParams.set("oferta", "1");
  if (state.sort !== options.defaultSort) nextParams.set("orden", state.sort);
  if (options.includePage && state.page > 1) {
    nextParams.set("pagina", String(state.page));
  }

  return nextParams;
}

export function sortProducts<T extends Product>(
  products: T[],
  sort: ProductSort,
  rankByProductId?: ReadonlyMap<string, number>,
) {
  return [...products].sort((first, second) => {
    const firstPrice = getProductPricingSummary(first).minimumEffectivePrice;
    const secondPrice = getProductPricingSummary(second).minimumEffectivePrice;

    if (sort === "price-asc") {
      return firstPrice - secondPrice || first.name.localeCompare(second.name, "es");
    }
    if (sort === "price-desc") {
      return secondPrice - firstPrice || first.name.localeCompare(second.name, "es");
    }
    if (sort === "name-desc") {
      return second.name.localeCompare(first.name, "es");
    }
    if (sort === "relevance") {
      return (
        (rankByProductId?.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
          (rankByProductId?.get(second.id) ?? Number.MAX_SAFE_INTEGER) ||
        first.name.localeCompare(second.name, "es")
      );
    }

    return first.name.localeCompare(second.name, "es");
  });
}
