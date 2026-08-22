import { describe, expect, it } from "vitest";
import {
  getEcuadorDateKey,
  isLowStock,
  isTodayInEcuador,
  resolveSelectedOrderId,
} from "./operacion-admin";

describe("reglas operativas del panel administrador", () => {
  it.each([
    [0, false],
    [1, true],
    [2, true],
    [3, false],
    [4, false],
  ])("clasifica el stock %i correctamente", (stock, expected) => {
    expect(isLowStock(stock)).toBe(expected);
  });

  it("calcula el día con la zona horaria de Ecuador", () => {
    expect(getEcuadorDateKey("2026-08-22T04:30:00.000Z")).toBe("2026-08-21");
    expect(getEcuadorDateKey("2026-08-22T05:30:00.000Z")).toBe("2026-08-22");
  });

  it("reconoce solamente pedidos del día operativo actual", () => {
    const now = new Date("2026-08-22T04:45:00.000Z");

    expect(isTodayInEcuador("2026-08-22T04:15:00.000Z", now)).toBe(true);
    expect(isTodayInEcuador("2026-08-22T05:15:00.000Z", now)).toBe(false);
  });

  it("abre solamente un pedido existente solicitado por la URL", () => {
    const availableOrderIds = ["pedido-1", "pedido-2"];

    expect(resolveSelectedOrderId("pedido-2", availableOrderIds)).toBe("pedido-2");
    expect(resolveSelectedOrderId("pedido-inexistente", availableOrderIds)).toBeNull();
    expect(resolveSelectedOrderId(["pedido-1", "pedido-2"], availableOrderIds)).toBeNull();
  });
});
