import { describe, expect, it } from "vitest";
import {
  calculateWelcomePromotion,
  getWelcomePromotionDaysRemaining,
  getWelcomePromotionPhase,
  isWelcomePromotionActive,
} from "./promocion-bienvenida";

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

  it("respeta el inicio y el cierre de la vigencia en Ecuador", () => {
    expect(getWelcomePromotionPhase(new Date("2026-08-22T04:59:59.999Z"))).toBe("programada");
    expect(isWelcomePromotionActive(new Date("2026-08-22T05:00:00.000Z"))).toBe(true);
    expect(isWelcomePromotionActive(new Date("2027-01-01T04:59:59.999Z"))).toBe(true);
    expect(getWelcomePromotionPhase(new Date("2027-01-01T05:00:00.000Z"))).toBe("finalizada");
  });

  it("calcula los dias restantes sin valores negativos", () => {
    expect(getWelcomePromotionDaysRemaining(new Date("2026-12-31T17:00:00.000Z"))).toBe(1);
    expect(getWelcomePromotionDaysRemaining(new Date("2027-01-02T05:00:00.000Z"))).toBe(0);
  });
});
