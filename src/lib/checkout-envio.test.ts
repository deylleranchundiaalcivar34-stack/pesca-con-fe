import { describe, expect, it } from "vitest";
import {
  getServientregaOfficeAddress,
  isGalapagosDestination,
  isValidEcuadorianCedula,
  normalizeEcuadorianCedula,
  resolveCheckoutDeliveryAddress,
} from "./checkout-envio";

describe("validaciones del envio en checkout", () => {
  it("normaliza y valida una cedula ecuatoriana", () => {
    expect(normalizeEcuadorianCedula("171-003-406-5")).toBe("1710034065");
    expect(isValidEcuadorianCedula("1710034065")).toBe(true);
  });

  it("rechaza una cedula con digito verificador incorrecto", () => {
    expect(isValidEcuadorianCedula("1710034064")).toBe(false);
  });

  it("identifica Galapagos por provincia o ciudad", () => {
    expect(isGalapagosDestination("Galápagos", "Puerto Ayora")).toBe(true);
    expect(isGalapagosDestination("Pichincha", "Galapagos")).toBe(true);
    expect(isGalapagosDestination("Pichincha", "Quito")).toBe(false);
  });

  it("usa la oficina central de la ciudad cuando la direccion opcional queda vacia", () => {
    expect(getServientregaOfficeAddress("Quito", "Pichincha")).toBe(
      "Oficina central de Servientrega de Quito, Pichincha",
    );
    expect(
      resolveCheckoutDeliveryAddress({
        deliveryType: "envio_servientrega",
        address: "   ",
        city: "Shushufindi",
        province: "Sucumbíos",
      }),
    ).toBe("Oficina central de Servientrega de Shushufindi, Sucumbíos");
  });

  it("conserva una direccion escrita y no crea destino para retiro local", () => {
    expect(
      resolveCheckoutDeliveryAddress({
        deliveryType: "envio_servientrega",
        address: "  Barrio Unión Popular  ",
        city: "Shushufindi",
        province: "Sucumbíos",
      }),
    ).toBe("Barrio Unión Popular");
    expect(
      resolveCheckoutDeliveryAddress({
        deliveryType: "retiro_local",
        city: "Shushufindi",
        province: "Sucumbíos",
      }),
    ).toBeNull();
  });
});
