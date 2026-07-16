import { describe, expect, it } from "vitest";
import {
  isGalapagosDestination,
  isValidEcuadorianCedula,
  normalizeEcuadorianCedula,
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
});
