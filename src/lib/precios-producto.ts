import type { Product, ProductVariant } from "@/types/producto";

type PriceSource = Pick<Product, "price" | "offerPrice"> | Pick<ProductVariant, "price" | "offerPrice">;

export interface ProductPricingSummary {
  hasVariants: boolean;
  hasOffer: boolean;
  minimumRegularPrice: number;
  minimumEffectivePrice: number;
  maximumDiscountPercentage: number;
}

export function hasActiveOffer(source: PriceSource) {
  return (
    typeof source.offerPrice === "number" &&
    Number.isFinite(source.offerPrice) &&
    source.offerPrice > 0 &&
    source.offerPrice < source.price
  );
}

export function getEffectivePrice(source: PriceSource) {
  return hasActiveOffer(source) ? source.offerPrice! : source.price;
}

export function getDiscountPercentage(source: PriceSource) {
  if (!hasActiveOffer(source) || source.price <= 0) return 0;
  return Math.round(((source.price - source.offerPrice!) / source.price) * 100);
}

export function getProductPricingSummary(product: Product): ProductPricingSummary {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const isCurrican = product.catalogPath.some((node) => node.slug === "curricanes");
  const priceSources = isCurrican ? [product, ...activeVariants] : activeVariants;

  if (!priceSources.length) {
    return {
      hasVariants: false,
      hasOffer: hasActiveOffer(product),
      minimumRegularPrice: product.price,
      minimumEffectivePrice: getEffectivePrice(product),
      maximumDiscountPercentage: getDiscountPercentage(product),
    };
  }

  return {
    hasVariants: activeVariants.length > 0,
    hasOffer: priceSources.some(hasActiveOffer),
    minimumRegularPrice: Math.min(...priceSources.map((source) => source.price)),
    minimumEffectivePrice: Math.min(...priceSources.map(getEffectivePrice)),
    maximumDiscountPercentage: Math.max(...priceSources.map(getDiscountPercentage)),
  };
}
