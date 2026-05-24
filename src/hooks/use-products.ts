import { mockProducts } from "@/data/mock-products";

export function useProducts() {
  return mockProducts.filter((product) => product.isActive);
}
