import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Une clases condicionales y resuelve conflictos de Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatea montos en dolares para mostrarlos en tienda y panel admin.
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

// Convierte textos de productos o marcas en slugs seguros para URL.
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Presenta fechas ISO en formato corto para pedidos y paneles.
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
