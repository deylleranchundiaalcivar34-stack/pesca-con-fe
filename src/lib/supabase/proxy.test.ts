import { describe, expect, it } from "vitest";
import { shouldRefreshSupabaseSession } from "./proxy";

describe("rutas con sesión SSR", () => {
  it.each([
    "/admin",
    "/admin/productos",
    "/checkout",
    "/checkout/resultado",
    "/mi-cuenta",
    "/login",
    "/restablecer-contrasena",
    "/api/sesion",
  ])("refresca cookies antes de atender %s", (pathname) => {
    expect(shouldRefreshSupabaseSession(pathname)).toBe(true);
  });

  it.each(["/", "/catalogo", "/productos/cana-casting"])(
    "mantiene las rutas públicas fuera del trabajo de sesión: %s",
    (pathname) => {
      expect(shouldRefreshSupabaseSession(pathname)).toBe(false);
    },
  );
});
