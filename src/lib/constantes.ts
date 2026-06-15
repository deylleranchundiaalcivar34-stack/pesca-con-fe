// URL publica base usada para SEO, sitemap y datos estructurados.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pescaconfe.com";

// Umbral compartido para mostrar alertas de bajo stock.
export const LOW_STOCK_THRESHOLD = 4;

// Etiquetas visibles para los estados internos de pedidos.
export const ORDER_STATUS_LABELS = {
  pendiente_pago: "Pendiente de pago",
  pagado_confirmado: "Pagado/Confirmado",
  listo_retiro: "Listo para retiro",
  retirado: "Retirado",
  enviado: "Enviado",
  cancelado: "Cancelado",
} as const;

// Etiquetas visibles para los tipos de entrega disponibles.
export const DELIVERY_TYPE_LABELS = {
  envio_servientrega: "Envío por Servientrega",
  retiro_local: "Retiro en local",
} as const;
