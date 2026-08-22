import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Order } from "@/types/pedido";
import type { Product } from "@/types/producto";
import { AdminOperationalSummary } from "./resumen-operativo-admin";

const order: Order = {
  id: "pedido-1",
  code: "PCF-1",
  customer: { fullName: "Cliente de prueba", phone: "0999999999" },
  items: [],
  subtotal: 20,
  discount: 0,
  shipping: 0,
  paymentFee: 0,
  total: 20,
  status: "pendiente_pago",
  paymentMethod: "transferencia",
  paymentStatus: "pendiente",
  deliveryType: "retiro_local",
  createdAt: "2026-08-22T15:00:00.000Z",
};

const product: Product = {
  id: "producto-1",
  slug: "producto-prueba",
  name: "Producto de prueba",
  sku: "SKU-1",
  brand: "Marca",
  category: "Señuelos",
  categorySlug: "senuelos",
  subcategory: "Trolling",
  subcategorySlug: "trolling",
  catalogPath: [],
  price: 10,
  stock: 2,
  description: "",
  features: [],
  attributes: {},
  images: [],
  variants: [],
  mainImage: "/producto.webp",
  imageAlt: "Producto de prueba",
  isFeatured: false,
  isActive: true,
};

describe("resumen operativo del administrador", () => {
  it("enlaza directamente cada aviso y no conserva los paneles de ver todos", () => {
    const html = renderToStaticMarkup(
      AdminOperationalSummary({ orders: [order], lowStockProducts: [product] }),
    );

    expect(html).toContain("/admin/pedidos?pedido=pedido-1");
    expect(html).toContain("/admin/productos/producto-1/editar");
    expect(html).not.toContain("Ver todos");
  });
});
