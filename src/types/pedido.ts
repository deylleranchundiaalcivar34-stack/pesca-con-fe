import type { Product } from "./producto";

// Modelos de pedidos usados por checkout, cuenta y panel administrativo.
export type OrderStatus =
  | "pendiente_pago"
  | "pagado_confirmado"
  | "listo_retiro"
  | "retirado"
  | "enviado"
  | "cancelado";

export type DeliveryType = "envio_servientrega" | "retiro_local";

export interface CustomerInfo {
  fullName: string;
  cedula?: string;
  phone: string;
  email?: string;
  province?: string;
  city?: string;
  address?: string;
  deliveryReference?: string;
  contactPhone?: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  productName: string;
  productSlug: string;
  image: string;
  price: number;
  quantity: number;
  categorySlug: Product["categorySlug"];
}

export interface Order {
  id: string;
  code: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  createdAt: string;
}
