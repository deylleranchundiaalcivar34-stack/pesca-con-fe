export const WELCOME_PROMOTION = {
  code: "BIENVENIDA10",
  minimumSubtotal: 50,
  percentage: 0.1,
  maximumDiscount: 10,
} as const;

export type WelcomePromotionStatus =
  | "disponible"
  | "reservada"
  | "canjeada"
  | "usada"
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
