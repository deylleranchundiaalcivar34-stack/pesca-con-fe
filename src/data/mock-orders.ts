import type { Order } from "@/types/order";
import { calculateShipping } from "@/lib/shipping";
import { mockProducts } from "./mock-products";

const product = (id: string) => {
  const found = mockProducts.find((item) => item.id === id);
  if (!found) throw new Error(`Mock product ${id} not found`);
  return found;
};

const makeItem = (productId: string, quantity: number) => {
  const item = product(productId);

  return {
    productId: item.id,
    productName: item.name,
    productSlug: item.slug,
    image: item.mainImage,
    price: item.price,
    quantity,
    categorySlug: item.categorySlug,
  };
};

const itemsA = [makeItem("prod-001", 1), makeItem("prod-007", 2)];
const itemsB = [makeItem("prod-004", 1), makeItem("prod-011", 1)];
const itemsC = [makeItem("prod-010", 2), makeItem("prod-008", 4)];
const itemsD = [makeItem("prod-005", 1)];

function subtotal(items: typeof itemsA) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function makeOrder(
  id: string,
  code: string,
  items: typeof itemsA,
  status: Order["status"],
  channel: Order["channel"],
  deliveryType: Order["deliveryType"],
  createdAt: string,
): Order {
  const orderSubtotal = subtotal(items);
  const shipping = deliveryType === "retiro_local" ? 0 : calculateShipping(items);
  const isPickup = deliveryType === "retiro_local";

  return {
    id,
    code,
    customer: {
      fullName:
        id === "ord-001"
          ? "Carlos Andrade"
          : id === "ord-002"
            ? "María Fernanda López"
            : id === "ord-003"
              ? "Jorge Lema"
              : "Andrea Zambrano",
      cedula: id === "ord-002" ? "2100457788" : undefined,
      phone: id === "ord-003" ? "0985554411" : "0939920000",
      email: id === "ord-001" ? "carlos@example.com" : undefined,
      province: isPickup ? undefined : id === "ord-004" ? "Manabí" : "Sucumbíos",
      city: isPickup ? undefined : id === "ord-004" ? "Manta" : "Shushufindi",
      address: isPickup ? undefined : "Barrio Central, calle principal y segunda",
      deliveryReference: isPickup ? undefined : "Casa de dos pisos, portón azul",
    },
    items,
    subtotal: orderSubtotal,
    shipping,
    total: orderSubtotal + shipping,
    bankAccountId: "pichincha-ahorro-deyller",
    status,
    channel,
    deliveryType,
    createdAt,
  };
}

export const mockOrders: Order[] = [
  makeOrder(
    "ord-001",
    "PCF-1001",
    itemsA,
    "pendiente_pago",
    "web",
    "envio_servientrega",
    "2026-05-12T14:25:00.000Z",
  ),
  makeOrder(
    "ord-002",
    "PCF-1002",
    itemsB,
    "pagado_confirmado",
    "whatsapp",
    "retiro_local",
    "2026-05-12T10:05:00.000Z",
  ),
  makeOrder(
    "ord-003",
    "PCF-1003",
    itemsC,
    "enviado",
    "presencial",
    "envio_servientrega",
    "2026-05-11T16:45:00.000Z",
  ),
  makeOrder(
    "ord-004",
    "PCF-1004",
    itemsD,
    "cancelado",
    "web",
    "retiro_local",
    "2026-05-10T09:10:00.000Z",
  ),
];
