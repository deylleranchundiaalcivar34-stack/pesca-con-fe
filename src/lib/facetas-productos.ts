import type {
  CatalogAttribute,
  CatalogNode,
  Product,
} from "@/types/producto";
import { normalizeSearchText } from "@/lib/busqueda-productos";
import { getProductAttributeValues } from "@/lib/filtros-catalogo";
import {
  SIZE_VARIANT_ATTRIBUTE_KEY,
  SIZE_VARIANT_MODE_VALUE,
  VARIANT_MODE_ATTRIBUTE_KEY,
} from "@/lib/opciones-producto";

export interface ProductFilterOption {
  value: string;
  label: string;
  count: number;
  level?: string;
  children?: ProductFilterOption[];
}

export interface ProductAttributeFilterFacet {
  key: string;
  attributeKey: string;
  label: string;
  catalogPath?: string;
  source: "catalog" | "variant-size";
  options: ProductFilterOption[];
}

function getProductPath(product: Product) {
  return product.catalogPath.map((item) => item.slug).filter(Boolean);
}

function getProductPathKeys(product: Product) {
  const slugs = getProductPath(product);
  return slugs.map((_, index) => slugs.slice(0, index + 1).join("/"));
}

function productBelongsToCatalogPath(product: Product, catalogPath?: string) {
  return !catalogPath || getProductPathKeys(product).includes(catalogPath);
}

function buildCatalogNodeOptions(
  nodes: CatalogNode[],
  counts: ReadonlyMap<string, number>,
  parentPath: string[] = [],
): ProductFilterOption[] {
  return nodes
    .filter((node) => node.isActive)
    .toSorted(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name, "es"),
    )
    .map((node) => {
      const path = [...parentPath, node.slug];
      const value = path.join("/");

      return {
        value,
        label: node.name,
        level: node.level,
        count: counts.get(value) ?? 0,
        children: buildCatalogNodeOptions(node.children, counts, path),
      };
    });
}

// La estructura siempre sale del catálogo configurado; los productos solo aportan
// los conteos, incluyendo en cada padre todos los productos de sus descendientes.
export function buildCatalogFilterOptions(
  catalogNodes: CatalogNode[],
  products: Product[],
) {
  const counts = new Map<string, number>();

  for (const product of products) {
    for (const path of getProductPathKeys(product)) {
      counts.set(path, (counts.get(path) ?? 0) + 1);
    }
  }

  return buildCatalogNodeOptions(catalogNodes, counts);
}

function getCatalogNodePaths(
  nodes: CatalogNode[],
  parentPath: string[] = [],
  paths = new Map<string, string>(),
) {
  for (const node of nodes) {
    const path = [...parentPath, node.slug];
    paths.set(node.id, path.join("/"));
    getCatalogNodePaths(node.children, path, paths);
  }

  return paths;
}

function getFacetOptions(
  products: Product[],
  getValues: (product: Product) => string[],
  getLabel: (value: string) => string = (value) => value,
) {
  const values = new Map<string, { label: string; count: number }>();

  for (const product of products) {
    const productValues = new Map(
      getValues(product).map((value) => [
        normalizeSearchText(value),
        getLabel(value),
      ]),
    );

    for (const [value, label] of productValues) {
      if (!value) continue;
      const current = values.get(value);
      values.set(value, { label, count: (current?.count ?? 0) + 1 });
    }
  }

  return [...values.entries()]
    .map(([value, option]) => ({ value, ...option }))
    .toSorted((first, second) => first.label.localeCompare(second.label, "es"));
}

function getVariantSizeValues(product: Product) {
  return product.variants
    .filter(
      (variant) =>
        variant.isActive &&
        variant.attributes[VARIANT_MODE_ATTRIBUTE_KEY] ===
          SIZE_VARIANT_MODE_VALUE,
    )
    .map((variant) => variant.attributes[SIZE_VARIANT_ATTRIBUTE_KEY]?.trim())
    .filter((value): value is string => Boolean(value));
}

function getVariantSizeLabel(value: string) {
  const inches = value.match(/(\d+(?:[.,]\d+)?)\s*(?:"|pulgadas?)/i);
  return inches ? `${inches[1]}"` : value;
}

// Cada definición conserva su categoría. Así, claves repetidas como `tamano`
// nunca mezclan carretes, combos y accesorios bajo una etiqueta equivocada.
export function buildProductAttributeFacets(
  products: Product[],
  attributes: CatalogAttribute[],
  catalogNodes: CatalogNode[] = [],
) {
  const catalogPathsByNodeId = getCatalogNodePaths(catalogNodes);
  const filterableAttributes = attributes.filter(
    (attribute) => attribute.isFilterable,
  );
  const keyUses = new Map<string, number>();

  for (const attribute of filterableAttributes) {
    keyUses.set(attribute.key, (keyUses.get(attribute.key) ?? 0) + 1);
  }

  const facets = filterableAttributes.flatMap<ProductAttributeFilterFacet>(
    (attribute) => {
      const catalogPath = catalogPathsByNodeId.get(attribute.catalogNodeId);
      const scopedProducts = catalogPath
        ? products.filter((product) =>
            productBelongsToCatalogPath(product, catalogPath),
          )
        : products;
      const options = getFacetOptions(scopedProducts, (product) =>
        getProductAttributeValues(product, attribute.key),
      );

      if (!options.length) return [];

      return [
        {
          key:
            (keyUses.get(attribute.key) ?? 0) > 1
              ? `${attribute.catalogNodeId}:${attribute.key}`
              : attribute.key,
          attributeKey: attribute.key,
          label: `${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ""}`,
          catalogPath,
          source: "catalog",
          options,
        },
      ];
    },
  );

  const sizeGroups = new Map<
    string,
    { label: string; path: string; products: Product[] }
  >();

  for (const product of products) {
    if (!getVariantSizeValues(product).length) continue;

    const pathKeys = getProductPathKeys(product);
    const isCoveredByCatalogAttribute = filterableAttributes.some(
      (attribute) =>
        attribute.key === SIZE_VARIANT_ATTRIBUTE_KEY &&
        (!catalogPathsByNodeId.get(attribute.catalogNodeId) ||
          pathKeys.includes(
            catalogPathsByNodeId.get(attribute.catalogNodeId) as string,
          )),
    );
    if (isCoveredByCatalogAttribute) continue;

    const leaf = product.catalogPath.at(-1);
    const path = pathKeys.at(-1);
    if (!leaf || !path) continue;

    const group = sizeGroups.get(path) ?? {
      label: `Tamaño · ${leaf.name}`,
      path,
      products: [],
    };
    group.products.push(product);
    sizeGroups.set(path, group);
  }

  for (const group of sizeGroups.values()) {
    const options = getFacetOptions(
      group.products,
      getVariantSizeValues,
      getVariantSizeLabel,
    );
    if (!options.length) continue;

    facets.push({
      key: `variante-tamano:${group.path}`,
      attributeKey: SIZE_VARIANT_ATTRIBUTE_KEY,
      label: group.label,
      catalogPath: group.path,
      source: "variant-size",
      options,
    });
  }

  return facets.toSorted((first, second) =>
    first.label.localeCompare(second.label, "es"),
  );
}

export function getProductFacetValues(
  product: Product,
  facet: ProductAttributeFilterFacet,
) {
  if (!productBelongsToCatalogPath(product, facet.catalogPath)) return [];

  return facet.source === "variant-size"
    ? getVariantSizeValues(product)
    : getProductAttributeValues(product, facet.attributeKey);
}
