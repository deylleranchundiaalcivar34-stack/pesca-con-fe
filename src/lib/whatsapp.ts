import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { CustomerInfo, DeliveryType, OrderItem } from "@/types/pedido";
import { businessConfig } from "@/data/datos-negocio";
import {
  isGalapagosDestination,
  resolveCheckoutDeliveryAddress,
} from "./checkout-envio";
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

interface ProductInquiryMessageInput {
  productName: string;
  productUrl: string;
  selectedOption?: string;
}

// Arma el mensaje que se envia al WhatsApp de la tienda al finalizar checkout.
export function buildCheckoutWhatsAppMessage(input: CheckoutMessageInput) {
  const business = input.business ?? businessConfig;
  const isGalapagosDelivery =
    input.deliveryType === "envio_servientrega" &&
    isGalapagosDestination(input.customer.province, input.customer.city);
  const productLines = input.items
    .map(
      (item) =>
        `• ${item.quantity} x ${item.productName} — ${formatCurrency(
          item.price * item.quantity,
        )}`,
    )
    .join("\n");
  const contactPhone = input.customer.contactPhone || input.customer.phone;
  const deliveryAddress = resolveCheckoutDeliveryAddress({
    deliveryType: input.deliveryType,
    address: input.customer.address,
    city: input.customer.city,
    province: input.customer.province,
  });

  return [
    input.orderCode
      ? `*${business.name.toUpperCase()} | PEDIDO ${input.orderCode}*`
      : `*${business.name.toUpperCase()} | NUEVO PEDIDO*`,
    "",
    "*CLIENTE*",
    `Nombre: ${input.customer.fullName}`,
    input.customer.cedula ? `Cédula: ${input.customer.cedula}` : undefined,
    `Celular: ${contactPhone}`,
    "",
    "*ENTREGA*",
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
      ? `Destino: ${deliveryAddress}`
      : undefined,
    input.deliveryType === "envio_servientrega" && input.customer.deliveryReference
      ? `Referencia adicional: ${input.customer.deliveryReference}`
      : undefined,
    isGalapagosDelivery
      ? "La tarifa de envío a Galápagos se confirmará según peso y tamaño."
      : undefined,
    "",
    "*PRODUCTOS*",
    productLines,
    "",
    "*RESUMEN*",
    `Subtotal: ${formatCurrency(input.subtotal)}`,
    isGalapagosDelivery
      ? "Envío: Por confirmar"
      : `Envío: ${formatCurrency(input.shipping)}`,
    isGalapagosDelivery
      ? `Total parcial: ${formatCurrency(input.total)}`
      : `Total: ${formatCurrency(input.total)}`,
    "",
    "*PAGO POR TRANSFERENCIA*",
    input.bankAccount
      ? `Banco seleccionado: ${input.bankAccount.bank}`
      : isGalapagosDelivery
        ? "Banco: Se seleccionará después de confirmar el valor del envío."
        : undefined,
    input.bankAccount
      ? "Adjunto el comprobante de transferencia para validar el pago."
      : isGalapagosDelivery
        ? "Quedo pendiente de la cotización para continuar con el pago."
        : undefined,
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

// Prepara una consulta contextual desde la ficha del producto.
export function buildProductInquiryWhatsAppMessage(
  input: ProductInquiryMessageInput,
) {
  const selectedOption = input.selectedOption?.trim();

  return [
    "Hola, quiero saber más de este producto:",
    `*${input.productName}*`,
    selectedOption ? `Opción elegida: ${selectedOption}` : undefined,
    "",
    `Enlace: ${input.productUrl}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

// Mantiene breve y privada la consulta iniciada desde el acceso flotante general.
export function buildGeneralSalesWhatsAppMessage(
  business: BusinessConfig = businessConfig,
) {
  return `Hola, necesito ayuda. Quisiera comunicarme con el Departamento de Ventas de ${business.name}.`;
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
