import { describe, expect, it } from "vitest";
import { businessConfig } from "@/data/datos-negocio";
import {
  buildCheckoutWhatsAppMessage,
  buildGeneralSalesWhatsAppMessage,
  buildProductInquiryWhatsAppMessage,
  getWhatsAppPrefilledUrl,
} from "./whatsapp";

describe("mensaje de WhatsApp del checkout", () => {
  it("agrupa los datos de envío y deja registrada la banca elegida", () => {
    const message = buildCheckoutWhatsAppMessage({
      customer: {
        fullName: "Deyller Anchundia",
        cedula: "2100948740",
        phone: "0939212684",
        contactPhone: "0939212684",
        province: "Sucumbíos",
        city: "Shushufindi",
        address: "Barrio Unión Popular",
      },
      items: [{ productId: "cana", productName: "Caña Casting Okuma Alaris", productSlug: "cana-casting-okuma-alaris", image: "", price: 49, quantity: 1, categorySlug: "canas" }],
      subtotal: 49,
      shipping: 8.5,
      total: 57.5,
      bankAccount: { id: "pichincha", bank: "Banco Pichincha", owner: "Deyller Anchundia", accountType: "Ahorro", accountNumber: "2205589763" },
      deliveryType: "envio_servientrega",
      orderCode: "PCF-1027",
    });

    expect(message).toContain("*PESCA CON FE | PEDIDO PCF-1027*");
    expect(message).toContain("*CLIENTE*");
    expect(message).toContain("*ENTREGA*");
    expect(message).toContain("Cédula: 2100948740");
    expect(message).toContain("Destino: Barrio Unión Popular");
    expect(message).toContain("*RESUMEN*");
    expect(message).toContain("Subtotal: $49,00");
    expect(message).toContain("Envío: $8,50");
    expect(message).toContain("Total: $57,50");
    expect(message).toContain("Banco seleccionado: Banco Pichincha");
    expect(message).not.toContain("2205589763");
    expect(message).not.toMatch(/[🎣📋👤🛒💳🏦📦📎✅]/u);
  });

  it("explica el destino automatico cuando el cliente no escribe direccion", () => {
    const message = buildCheckoutWhatsAppMessage({
      customer: {
        fullName: "Cliente Prueba",
        cedula: "1710034065",
        phone: "0981234567",
        contactPhone: "0981234567",
        province: "Pichincha",
        city: "Quito",
      },
      items: [{ productId: "cana", productName: "Caña", productSlug: "cana", image: "", price: 20, quantity: 1, categorySlug: "canas" }],
      subtotal: 20,
      shipping: 6.5,
      total: 26.5,
      bankAccount: { id: "banco", bank: "Banco Prueba", owner: "Pesca Con Fe", accountType: "Ahorro", accountNumber: "123" },
      deliveryType: "envio_servientrega",
    });

    expect(message).toContain(
      "Destino: Oficina central de Servientrega de Quito, Pichincha",
    );
  });

  it("abre el mensaje precargado unicamente al WhatsApp configurado", () => {
    const message = "Pedido de prueba";
    const url = getWhatsAppPrefilledUrl(message, businessConfig);

    expect(url).toBe(
      "https://wa.me/593984967946?text=Pedido%20de%20prueba",
    );
    expect(businessConfig.social.whatsapp).toBe(
      "https://wa.me/message/3VVYXYKPQKUQP1",
    );
  });
});

describe("consulta de producto por WhatsApp", () => {
  it("incluye únicamente producto, opción elegida y enlace público", () => {
    const message = buildProductInquiryWhatsAppMessage({
      productName: "Señuelo Curricán Trolling",
      productUrl: "https://pescaconfe.com/producto/senuelo-currican-trolling",
      selectedOption: "Morado escarchado",
    });

    expect(message).toContain("Hola, quiero saber más de este producto:");
    expect(message).toContain("Señuelo Curricán Trolling");
    expect(message).toContain("Opción elegida: Morado escarchado");
    expect(message).toContain(
      "Enlace: https://pescaconfe.com/producto/senuelo-currican-trolling",
    );
    expect(message).not.toContain("SKU:");
    expect(message).not.toContain("Disponibilidad actual:");
    expect(message).not.toContain("Longitud:");
  });

  it("omite la línea de opción cuando el producto no tiene una selección", () => {
    const message = buildProductInquiryWhatsAppMessage({
      productName: "Producto sin variantes",
      productUrl: "https://pescaconfe.com/producto/producto-sin-variantes",
    });

    expect(message).not.toContain("Opción elegida:");
  });
});

describe("ayuda general por WhatsApp", () => {
  it("genera una consulta breve sin enlaces ni datos del cliente", () => {
    const message = buildGeneralSalesWhatsAppMessage();

    expect(message).toBe(
      "Hola, necesito ayuda. Quisiera comunicarme con el Departamento de Ventas de Pesca Con Fe.",
    );
    expect(message).not.toContain("http");
    expect(message).not.toContain("producto");
    expect(message).not.toContain("carrito");
    expect(message).not.toContain("pedido");
  });
});
