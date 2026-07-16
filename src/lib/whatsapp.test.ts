import { describe, expect, it } from "vitest";
import { buildCheckoutWhatsAppMessage } from "./whatsapp";

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

    expect(message).toContain("*PEDIDO PCF-1027*");
    expect(message).toContain("Pedido enviado por: Deyller Anchundia");
    expect(message).toContain("*DATOS PARA EL ENVÍO*");
    expect(message).toContain("Cédula: 2100948740");
    expect(message).toContain("El cliente seleccionó la banca: Banco Pichincha.");
    expect(message).not.toContain("2205589763");
    expect(message).not.toMatch(/[🎣📋👤🛒💳🏦📦📎✅]/u);
  });
});
