import type { BankAccount } from "@/types/business";
import type { CustomerInfo, DeliveryType, OrderItem } from "@/types/order";
import { businessConfig } from "@/data/mock-business";
import { formatCurrency } from "./utils";

interface CheckoutMessageInput {
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  bankAccount: BankAccount;
  deliveryType: DeliveryType;
  orderCode?: string;
}

export function buildCheckoutWhatsAppMessage(input: CheckoutMessageInput) {
  const productLines = input.items
    .map(
      (item) =>
        `- ${item.productName} x${item.quantity}: ${formatCurrency(
          item.price * item.quantity,
        )}`,
    )
    .join("\n");

  return [
    `Hola, soy ${input.customer.fullName}. Genere un pedido en Pesca Con Fe.`,
    input.orderCode ? `Pedido: ${input.orderCode}` : undefined,
    "",
    "Productos:",
    productLines,
    "",
    `Subtotal: ${formatCurrency(input.subtotal)}`,
    input.deliveryType === "retiro_local"
      ? "Retiro en local: sin costo de envio"
      : `Envio Servientrega: ${formatCurrency(input.shipping)}`,
    `Total: ${formatCurrency(input.total)}`,
    "",
    `Banco elegido: ${input.bankAccount.bank}`,
    `Cuenta: ${input.bankAccount.accountType} ${input.bankAccount.accountNumber}`,
    `Titular: ${input.bankAccount.owner}`,
    "",
    input.deliveryType === "retiro_local"
      ? "Entrega: retiro en local fisico"
      : `Entrega: ${input.customer.city}, ${input.customer.province}`,
    input.deliveryType === "retiro_local"
      ? `Direccion de retiro: ${businessConfig.location}, ${businessConfig.city}`
      : `Direccion: ${input.customer.address}`,
    input.deliveryType === "retiro_local"
      ? `Horario: ${businessConfig.schedule}`
      : undefined,
    input.deliveryType === "retiro_local"
      ? businessConfig.localPickupInstructions
      : input.customer.deliveryReference
        ? `Referencia: ${input.customer.deliveryReference}`
        : undefined,
    "",
    "Adjunto comprobante de transferencia.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getWhatsAppPrefilledUrl(message: string) {
  // Los enlaces https://wa.me/message/<codigo> abren el perfil/mensaje del negocio,
  // pero WhatsApp no garantiza que acepten un parametro ?text prellenado.
  // Para checkout se usa el numero E.164 con https://wa.me/<numero>?text=...
  return `https://wa.me/${businessConfig.whatsappPhoneE164}?text=${encodeURIComponent(
    message,
  )}`;
}

export function getBusinessWhatsAppUrl() {
  return businessConfig.social.whatsapp;
}
