import { describe, expect, it } from "vitest";
import { calculateWelcomePromotion } from "./promocion-bienvenida";

describe("calculateWelcomePromotion", () => {
  it("no aplica por debajo de $50", () => {
    expect(
      calculateWelcomePromotion({ subtotal: 49.99, available: true, hasExistingOffer: false }),
    ).toEqual({
      applies: false,
      discount: 0,
      amountUntilEligible: 0.01,
      reason: "subtotal_insuficiente",
    });
  });

  it("aplica 10% desde $50", () => {
    expect(
      calculateWelcomePromotion({ subtotal: 50, available: true, hasExistingOffer: false }),
    ).toMatchObject({ applies: true, discount: 5, reason: "aplicada" });
  });

  it("limita el descuento a $10", () => {
    expect(
      calculateWelcomePromotion({ subtotal: 180, available: true, hasExistingOffer: false }),
    ).toMatchObject({ applies: true, discount: 10, reason: "aplicada" });
  });

  it("no combina el beneficio con precios de oferta", () => {
    expect(
      calculateWelcomePromotion({ subtotal: 80, available: true, hasExistingOffer: true }),
    ).toMatchObject({ applies: false, discount: 0, reason: "oferta_existente" });
  });

  it("no aplica si la cuenta ya utilizo o reservo el beneficio", () => {
    expect(
      calculateWelcomePromotion({ subtotal: 80, available: false, hasExistingOffer: false }),
    ).toMatchObject({ applies: false, discount: 0, reason: "no_disponible" });
  });
});
