export const ECUADOR_TIME_ZONE = "America/Guayaquil";

// Una existencia en cero se mantiene como agotada; bajo stock significa 1 o 2.
export function isLowStock(stock: number) {
  return stock > 0 && stock < 3;
}

// Evita que el servidor de Vercel (UTC) cambie el día operativo de la tienda.
export function getEcuadorDateKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ECUADOR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function isTodayInEcuador(value: Date | string, now: Date = new Date()) {
  return getEcuadorDateKey(value) === getEcuadorDateKey(now);
}

export function resolveSelectedOrderId(
  requestedOrder: string | string[] | undefined,
  availableOrderIds: Iterable<string>,
) {
  if (typeof requestedOrder !== "string") return null;
  return new Set(availableOrderIds).has(requestedOrder) ? requestedOrder : null;
}
