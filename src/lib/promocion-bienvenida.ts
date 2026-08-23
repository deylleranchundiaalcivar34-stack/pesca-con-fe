export const WELCOME_PROMOTION = {
  code: "BIENVENIDA10",
  minimumSubtotal: 50,
  percentage: 0.1,
  maximumDiscount: 10,
  startsAt: "2026-08-22T05:00:00.000Z",
  endsAt: "2027-01-01T05:00:00.000Z",
  validityLabel: "Del 22 de agosto al 31 de diciembre de 2026",
  endDateLabel: "31 de diciembre de 2026",
} as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type WelcomePromotionPhase = "programada" | "activa" | "finalizada";

export type WelcomePromotionStatus =
  | "disponible"
  | "reservada"
  | "canjeada"
  | "usada"
  | "inactiva"
  | "no_autenticado";

export type WelcomePromotionCalculation = {
  applies: boolean;
  discount: number;
  amountUntilEligible: number;
  reason: "aplicada" | "subtotal_insuficiente" | "oferta_existente" | "no_disponible";
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getWelcomePromotionPhase(now: Date = new Date()): WelcomePromotionPhase {
  const timestamp = now.getTime();
  if (timestamp < Date.parse(WELCOME_PROMOTION.startsAt)) return "programada";
  if (timestamp >= Date.parse(WELCOME_PROMOTION.endsAt)) return "finalizada";
  return "activa";
}

export function isWelcomePromotionActive(now: Date = new Date()) {
  return getWelcomePromotionPhase(now) === "activa";
}

export function getWelcomePromotionDaysRemaining(now: Date = new Date()) {
  if (!isWelcomePromotionActive(now)) return 0;
  return Math.max(0, Math.ceil((Date.parse(WELCOME_PROMOTION.endsAt) - now.getTime()) / DAY_IN_MS));
}

// Replica únicamente la vista previa del checkout. Postgres vuelve a validar y
// calcular el beneficio al crear el pedido y es la fuente autoritativa.
export function calculateWelcomePromotion({
  subtotal,
  available,
  hasExistingOffer,
}: {
  subtotal: number;
  available: boolean;
  hasExistingOffer: boolean;
}): WelcomePromotionCalculation {
  if (!available) {
    return { applies: false, discount: 0, amountUntilEligible: 0, reason: "no_disponible" };
  }

  if (hasExistingOffer) {
    return { applies: false, discount: 0, amountUntilEligible: 0, reason: "oferta_existente" };
  }

  if (subtotal < WELCOME_PROMOTION.minimumSubtotal) {
    return {
      applies: false,
      discount: 0,
      amountUntilEligible: roundCurrency(WELCOME_PROMOTION.minimumSubtotal - subtotal),
      reason: "subtotal_insuficiente",
    };
  }

  return {
    applies: true,
    discount: Math.min(
      roundCurrency(subtotal * WELCOME_PROMOTION.percentage),
      WELCOME_PROMOTION.maximumDiscount,
    ),
    amountUntilEligible: 0,
    reason: "aplicada",
  };
}
