import type { Product } from "@/types/producto";

export const DEFAULT_CURRICAN_BASE_OPTION_NAME = "Señuelo base";
export const MAX_PRODUCT_BASE_OPTION_NAME_LENGTH = 160;

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
