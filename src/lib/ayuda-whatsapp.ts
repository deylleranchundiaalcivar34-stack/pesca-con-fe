const HIDDEN_ROUTE_PREFIXES = ["/admin", "/producto"] as const;

// El acceso general no aparece donde ya existe una consulta especifica del producto.
export function shouldShowFloatingWhatsAppHelp(pathname: string) {
  return !HIDDEN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
