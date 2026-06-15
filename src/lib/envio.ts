import type { Product } from "@/types/producto";
import type { DeliveryType, OrderItem } from "@/types/pedido";

export interface ShippingInputItem {
  product: Pick<Product, "categorySlug">;
  quantity: number;
}

// Define el costo base segun la categoria del producto.
export function getProductShipping(categorySlug: Product["categorySlug"]) {
  if (categorySlug === "canas") return 8.5;
  if (categorySlug === "carrete") return 6.5;
  return 6.5;
}

// Cobra una sola tarifa: la mas alta entre los productos del pedido.
export function calculateShipping(items: ShippingInputItem[] | OrderItem[]) {
  if (!items.length) return 0;

  return items.reduce((highest, item) => {
    const categorySlug =
      "product" in item ? item.product.categorySlug : item.categorySlug;
    return Math.max(highest, getProductShipping(categorySlug));
  }, 0);
}

// Quita el costo de envio cuando el cliente retira en el local.
export function calculateDeliveryCost(
  items: ShippingInputItem[] | OrderItem[],
  deliveryType: DeliveryType,
) {
  if (deliveryType === "retiro_local") return 0;

  return calculateShipping(items);
}
