export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pescaconfe.com";

export const LOW_STOCK_THRESHOLD = 4;

export const ORDER_STATUS_LABELS = {
  pendiente_pago: "Pendiente de pago",
  pagado_confirmado: "Pagado/Confirmado",
  listo_retiro: "Listo para retiro",
  retirado: "Retirado",
  enviado: "Enviado",
  cancelado: "Cancelado",
} as const;

export const SALES_CHANNEL_LABELS = {
  presencial: "Presencial",
  whatsapp: "WhatsApp",
  web: "Web",
} as const;

export const DELIVERY_TYPE_LABELS = {
  envio_servientrega: "Envío por Servientrega",
  retiro_local: "Retiro en local",
} as const;
