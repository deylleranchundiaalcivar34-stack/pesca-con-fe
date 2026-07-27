import type { Product } from "@/types/producto";

export const DEFAULT_CURRICAN_BASE_OPTION_NAME = "Señuelo base";
export const MAX_PRODUCT_BASE_OPTION_NAME_LENGTH = 160;
export const SIZE_VARIANT_ATTRIBUTE_KEY = "tamano";
export const VARIANT_MODE_ATTRIBUTE_KEY = "modo_variante";
export const SIZE_VARIANT_MODE_VALUE = "tamano";

export function isLureAccessoryPath(
  catalogPath: Array<Pick<Product["catalogPath"][number], "slug">>,
) {
  return (
    catalogPath[0]?.slug === "senuelos" &&
    catalogPath.some((node) => node.slug === "accesorios-para-senuelos")
  );
}

export function isCurricanProduct(
  product: Pick<Product, "catalogPath">,
) {
  return product.catalogPath.some((node) => node.slug === "curricanes");
}

export function getProductBaseOptionName(
  product: Pick<Product, "baseOptionName">,
) {
  return product.baseOptionName?.trim() || DEFAULT_CURRICAN_BASE_OPTION_NAME;
}

export function hasColorVariants(
  product: Pick<Product, "catalogPath" | "variants">,
) {
  return (
    !isCurricanProduct(product) &&
    product.variants.some((variant) =>
      Boolean(variant.attributes.color?.trim()),
    )
  );
}

export function hasSizeVariants(
  product: Pick<Product, "catalogPath" | "variants">,
) {
  return (
    !isCurricanProduct(product) &&
    product.variants.some(
      (variant) =>
        variant.attributes[VARIANT_MODE_ATTRIBUTE_KEY] ===
          SIZE_VARIANT_MODE_VALUE &&
        Boolean(variant.attributes[SIZE_VARIANT_ATTRIBUTE_KEY]?.trim()),
    )
  );
}

export function getAutomaticVariantSummary(
  variants: Array<Pick<Product["variants"][number], "price" | "stock" | "isActive">>,
) {
  const activeVariants = variants.filter((variant) => variant.isActive);
  const priceSources = activeVariants.length ? activeVariants : variants;

  return {
    price: priceSources.length
      ? Math.min(...priceSources.map((variant) => variant.price))
      : 0,
    stock: activeVariants.reduce((total, variant) => total + variant.stock, 0),
  };
}
