import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { CustomerInfo, DeliveryType, OrderItem } from "@/types/pedido";
import { businessConfig } from "@/data/datos-negocio";
import { formatCurrency } from "./utilidades";

interface CheckoutMessageInput {
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  bankAccount: BankAccount;
  deliveryType: DeliveryType;
  orderCode?: string;
  business?: BusinessConfig;
}

// Arma el mensaje que se envia al WhatsApp de la tienda al finalizar checkout.
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
    `Hola, soy ${input.customer.fullName}. Generé un pedido en Pesca Con Fe.`,
    input.orderCode ? `Pedido: ${input.orderCode}` : undefined,
    "",
    "Productos:",
    productLines,
    "",
    `Subtotal: ${formatCurrency(input.subtotal)}`,
    input.deliveryType === "retiro_local"
      ? "Retiro en local: sin costo de envío"
      : `Envío Servientrega: ${formatCurrency(input.shipping)}`,
    `Total: ${formatCurrency(input.total)}`,
    "",
    `Banco elegido: ${input.bankAccount.bank}`,
    `Cuenta: ${input.bankAccount.accountType} ${input.bankAccount.accountNumber}`,
    `Titular: ${input.bankAccount.owner}`,
    "",
    input.deliveryType === "retiro_local"
      ? "Entrega: retiro en local físico"
      : `Entrega: ${input.customer.city}, ${input.customer.province}`,
    input.deliveryType === "envio_servientrega"
      ? `Dirección: ${input.customer.address}`
      : undefined,
    input.deliveryType === "envio_servientrega" && input.customer.deliveryReference
        ? `Referencia: ${input.customer.deliveryReference}`
        : undefined,
    input.deliveryType === "envio_servientrega" && input.customer.contactPhone
      ? `Celular de contacto: ${input.customer.contactPhone}`
      : undefined,
    "",
    "Adjunto comprobante de transferencia.",
  ]
    .filter(Boolean)
    .join("\n");
}

// Codifica un mensaje para abrir WhatsApp con texto precargado.
export function getWhatsAppPrefilledUrl(message: string, business: BusinessConfig = businessConfig) {
  // Los enlaces https://wa.me/message/<codigo> abren el perfil/mensaje del negocio,
  // pero WhatsApp no garantiza que acepten un parametro ?text prellenado.
  // Para checkout se usa el numero E.164 con https://wa.me/<numero>?text=...
  return `https://wa.me/${business.whatsappPhoneE164}?text=${encodeURIComponent(
    message,
  )}`;
}

// Abre el chat general de la tienda sin mensaje de pedido.
export function getBusinessWhatsAppUrl() {
  return businessConfig.social.whatsapp;
}
