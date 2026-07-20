import { describe, expect, it } from "vitest";
import { getAdminHome, hasAdminPermission, isAdminRole } from "./admin-permissions";

describe("admin permissions", () => {
  it("reserva la gestión de roles al dueño", () => {
    expect(hasAdminPermission("dueno", "roles.manage")).toBe(true);
    expect(hasAdminPermission("admin", "roles.manage")).toBe(false);
    expect(hasAdminPermission("vendedor", "roles.manage")).toBe(false);
  });

  it("limita al vendedor a ventas y lectura de catálogo", () => {
    expect(hasAdminPermission("vendedor", "sales.create")).toBe(true);
    expect(hasAdminPermission("vendedor", "catalog.read")).toBe(true);
    expect(hasAdminPermission("vendedor", "orders.read")).toBe(false);
    expect(hasAdminPermission("vendedor", "catalog.write")).toBe(false);
    expect(getAdminHome("vendedor")).toBe("/admin/ventas-fisicas");
  });

  it("rechaza nombres de rol desconocidos", () => {
    expect(isAdminRole("dueno")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(false);
  });
});
