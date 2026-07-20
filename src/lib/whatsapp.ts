import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { CustomerInfo, DeliveryType, OrderItem } from "@/types/pedido";
import { businessConfig } from "@/data/datos-negocio";
import { isGalapagosDestination } from "./checkout-envio";
import { formatCurrency } from "./utilidades";

interface CheckoutMessageInput {
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  bankAccount?: BankAccount;
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
  const isGalapagosDelivery =
    input.deliveryType === "envio_servientrega" &&
    isGalapagosDestination(input.customer.province, input.customer.city);
  const productLines = input.items
    .map(
      (item) =>
        `• ${item.productName} x${item.quantity}: ${formatCurrency(
          item.price * item.quantity,
        )}`,
    )
    .join("\n");
  const contactPhone = input.customer.contactPhone || input.customer.phone;
  const deliveryAddress = input.customer.address?.trim();
  const officeDeliveryMessage = input.customer.city
    ? `Oficina de Servientrega de ${input.customer.city}`
    : "Oficina de Servientrega de la ciudad seleccionada";

  return [
    input.orderCode ? `*PEDIDO ${input.orderCode}*` : "*PEDIDO*",
    `Pedido enviado por: ${input.customer.fullName}`,
    `Número celular: ${contactPhone}`,
    "",
    "*PRODUCTOS*",
    productLines,
    "",
    "*DATOS PARA EL ENVÍO*",
    `Nombre: ${input.customer.fullName}`,
    input.customer.cedula ? `Cédula: ${input.customer.cedula}` : undefined,
    `Celular: ${contactPhone}`,
    input.deliveryType === "retiro_local"
      ? "Modalidad: Retiro en el local"
      : "Modalidad: Envío por Servientrega",
    input.deliveryType === "envio_servientrega"
      ? `Provincia: ${input.customer.province}`
      : undefined,
    input.deliveryType === "envio_servientrega"
      ? `Ciudad: ${input.customer.city}`
      : undefined,
    input.deliveryType === "envio_servientrega"
      ? `Dirección de referencia: ${deliveryAddress || officeDeliveryMessage}`
      : undefined,
    input.deliveryType === "envio_servientrega" && input.customer.deliveryReference
      ? `Referencia adicional: ${input.customer.deliveryReference}`
      : undefined,
    isGalapagosDelivery
      ? "La tarifa de envío a Galápagos se confirmará según peso y tamaño."
      : undefined,
    "",
    input.bankAccount
      ? `El cliente seleccionó la banca: ${input.bankAccount.bank}.`
      : isGalapagosDelivery
        ? "El cliente espera la cotización de envío antes de seleccionar la banca."
        : undefined,
    input.bankAccount ? "El cliente enviará el comprobante de transferencia para corroborar la información." : undefined,
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
