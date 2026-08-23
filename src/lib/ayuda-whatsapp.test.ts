import { describe, expect, it } from "vitest";
import { shouldShowFloatingWhatsAppHelp } from "./ayuda-whatsapp";

describe("visibilidad de la ayuda general por WhatsApp", () => {
  it.each([
    "/",
    "/productos",
    "/productos/senuelos/para-mar",
    "/producto",
    "/producto/senuelo-currican-trolling",
    "/contacto",
    "/mi-cuenta",
    "/login",
  ])("se muestra en la pagina publica %s", (pathname) => {
    expect(shouldShowFloatingWhatsAppHelp(pathname)).toBe(true);
  });

  it.each([
    "/carrito",
    "/carrito/resumen",
    "/checkout",
    "/checkout/resultado",
    "/admin",
    "/admin/productos",
  ])("se oculta en la ruta excluida %s", (pathname) => {
    expect(shouldShowFloatingWhatsAppHelp(pathname)).toBe(false);
  });

  it.each(["/carrito-abandonado", "/checkout-ayuda", "/administradores"])(
    "no confunde rutas publicas parecidas: %s",
    (pathname) => {
      expect(shouldShowFloatingWhatsAppHelp(pathname)).toBe(true);
    },
  );
});
