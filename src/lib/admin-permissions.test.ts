import { describe, expect, it } from "vitest";
import { hasAdminPermission, isAdminRole } from "./admin-permissions";

describe("admin permissions", () => {
  it("reserva la gestión de roles al dueño", () => {
    expect(hasAdminPermission("dueno", "roles.manage")).toBe(true);
    expect(hasAdminPermission("admin", "roles.manage")).toBe(false);
  });

  it("rechaza nombres de rol desconocidos", () => {
    expect(isAdminRole("dueno")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("vendedor")).toBe(false);
    expect(isAdminRole("superadmin")).toBe(false);
  });
});
