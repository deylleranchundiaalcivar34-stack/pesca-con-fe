import type { OrderItem } from "@/types/order";
import type { Product } from "@/types/product";

export function reduceStockForPaidOrder(products: Product[], items: OrderItem[]) {
  return products.map((product) => {
    const item = items.find((candidate) => candidate.productId === product.id);
    if (!item) return product;

    return {
      ...product,
      stock: Math.max(product.stock - item.quantity, 0),
    };
  });
}
