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

interface CustomerQuestionMessageInput {
  question: string;
  fullName?: string;
}

// Arma el mensaje que se envia al WhatsApp de la tienda al finalizar checkout.
export function buildCheckoutWhatsAppMessage(input: CheckoutMessageInput) {
  const productLines = input.items
    .map(
      (item) =>
        `• ${item.productName} x${item.quantity}: ${formatCurrency(
          item.price * item.quantity,
        )}`,
    )
    .join("\n");

  return [
    "*NUEVO PEDIDO - PESCA CON FE*",
    input.orderCode ? `Código: *${input.orderCode}*` : undefined,
    "",
    "*CLIENTE*",
    `Nombre: ${input.customer.fullName}`,
    "",
    "*PRODUCTOS*",
    productLines,
    "",
    "*RESUMEN DE PAGO*",
    `Subtotal: ${formatCurrency(input.subtotal)}`,
    input.deliveryType === "retiro_local"
      ? "Retiro en local: sin costo de envío"
      : `Envío Servientrega: ${formatCurrency(input.shipping)}`,
    `*Total: ${formatCurrency(input.total)}*`,
    "",
    "*CUENTA BANCARIA*",
    `Banco: ${input.bankAccount.bank}`,
    `Cuenta: ${input.bankAccount.accountType} ${input.bankAccount.accountNumber}`,
    `Titular: ${input.bankAccount.owner}`,
    "",
    "*ENTREGA*",
    input.deliveryType === "retiro_local"
      ? "Modalidad: retiro en el local"
      : "Modalidad: envío por Servientrega",
    input.deliveryType === "envio_servientrega"
      ? `Destino: ${input.customer.city}, ${input.customer.province}`
      : undefined,
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
    "Adjunto el comprobante de transferencia para confirmar el pago.",
  ]
    .filter(Boolean)
    .join("\n");
}

// Arma una consulta general identificada con la cuenta que inició sesión.
export function buildCustomerQuestionWhatsAppMessage(
  input: CustomerQuestionMessageInput,
) {
  return [
    "*CONSULTA - PESCA CON FE*",
    "",
    "*CLIENTE*",
    input.fullName || "Cliente autenticado",
    "",
    "*PREGUNTA*",
    input.question,
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
