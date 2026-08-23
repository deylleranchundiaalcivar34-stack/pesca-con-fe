const HIDDEN_ROUTE_PREFIXES = ["/admin", "/carrito", "/checkout"] as const;

// Los accesos flotantes no compiten con los pasos sensibles de compra ni con el panel.
export function shouldShowFloatingWhatsAppHelp(pathname: string) {
  return !HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
