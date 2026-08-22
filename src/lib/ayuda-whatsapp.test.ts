import { describe, expect, it } from "vitest";
import { shouldShowFloatingWhatsAppHelp } from "./ayuda-whatsapp";

describe("visibilidad de la ayuda general por WhatsApp", () => {
  it.each([
    "/",
    "/productos",
    "/productos/senuelos/para-mar",
    "/carrito",
    "/checkout",
    "/contacto",
    "/mi-cuenta",
  ])("se muestra en la pagina publica %s", (pathname) => {
    expect(shouldShowFloatingWhatsAppHelp(pathname)).toBe(true);
  });

  it.each([
    "/producto",
    "/producto/senuelo-currican-trolling",
    "/admin",
    "/admin/productos",
  ])("se oculta en la ruta excluida %s", (pathname) => {
    expect(shouldShowFloatingWhatsAppHelp(pathname)).toBe(false);
  });
});
