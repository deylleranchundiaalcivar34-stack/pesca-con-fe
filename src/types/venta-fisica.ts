type PhysicalPaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "otro";

export interface PhysicalSaleItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  price: number;
  quantity: number;
}

export interface PhysicalSale {
  id: string;
  code: string;
  note?: string;
  paymentMethod: PhysicalPaymentMethod;
  subtotal: number;
  total: number;
  createdAt: string;
  items: PhysicalSaleItem[];
}
