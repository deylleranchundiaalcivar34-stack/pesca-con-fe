import { describe, expect, it } from "vitest";
import { resolvePaymentResult, type VerifiedPaymentOrder } from "./resultado-pago";

const approvedOrder: VerifiedPaymentOrder = {
  code: "PCF-1027",
  status: "pagado_confirmado",
  paymentStatus: "aprobado",
  productIds: ["producto-1"],
};

describe("resolvePaymentResult", () => {
  it("solo aprueba un pedido verificado y persistido", () => {
    expect(resolvePaymentResult(approvedOrder)).toBe("approved");
    expect(resolvePaymentResult(null)).toBe("error");
  });

  it("no aprueba estados de pago o pedido inconsistentes", () => {
    expect(resolvePaymentResult({ ...approvedOrder, paymentStatus: "pendiente" })).toBe("error");
    expect(resolvePaymentResult({ ...approvedOrder, status: "pendiente_pago" })).toBe("error");
  });

  it("reconoce una cancelación almacenada", () => {
    expect(
      resolvePaymentResult({
        ...approvedOrder,
        status: "cancelado",
        paymentStatus: "cancelado",
      }),
    ).toBe("canceled");
  });
});
