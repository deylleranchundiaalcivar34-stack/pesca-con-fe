import type { Product } from "./product";

export type OrderStatus =
  | "pendiente_pago"
  | "pagado_confirmado"
  | "listo_retiro"
  | "retirado"
  | "enviado"
  | "cancelado";

export type SalesChannel = "presencial" | "whatsapp" | "web";
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
  bankAccountId: string;
  status: OrderStatus;
  channel: SalesChannel;
  deliveryType: DeliveryType;
  createdAt: string;
}
