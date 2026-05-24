import type { Product } from "@/types/product";
import type { DeliveryType, OrderItem } from "@/types/order";

export interface ShippingInputItem {
  product: Pick<Product, "categorySlug">;
  quantity: number;
}

export function getProductShipping(categorySlug: Product["categorySlug"]) {
  if (categorySlug === "canas") return 8.5;
  if (categorySlug === "carrete") return 6.5;
  return 6.5;
}

export function calculateShipping(items: ShippingInputItem[] | OrderItem[]) {
  if (!items.length) return 0;

  return items.reduce((highest, item) => {
    const categorySlug =
      "product" in item ? item.product.categorySlug : item.categorySlug;
    return Math.max(highest, getProductShipping(categorySlug));
  }, 0);
}

export function calculateDeliveryCost(
  items: ShippingInputItem[] | OrderItem[],
  deliveryType: DeliveryType,
) {
  if (deliveryType === "retiro_local") return 0;

  return calculateShipping(items);
}
