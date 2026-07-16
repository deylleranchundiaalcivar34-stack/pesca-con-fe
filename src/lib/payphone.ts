import "server-only";

const PAYPHONE_PREPARE_URL =
  "https://pay.payphonetodoesposible.com/api/button/Prepare";
const PAYPHONE_CONFIRM_URL =
  "https://pay.payphonetodoesposible.com/api/button/V2/Confirm";
const REQUEST_TIMEOUT_MS = 12_000;

type PayPhoneTaxMode = "without_tax" | "tax_included";

type PayPhoneConfig = {
  token: string;
  storeId: string;
  responseUrl: string;
  cancellationUrl: string;
  taxMode: PayPhoneTaxMode;
  taxRate: number;
};

type PayPhoneErrorBody = {
  message?: unknown;
  errorCode?: unknown;
};

export type PayPhonePrepareResult = {
  paymentId: string;
  payWithCard: string;
  payWithPayPhone: string;
};

export type PayPhoneConfirmation = {
  amount: number;
  clientTransactionId: string;
  statusCode: number;
  transactionStatus: string;
  authorizationCode?: string | null;
  message?: string | null;
  messageCode?: number | null;
  transactionId: number;
  currency?: string | null;
  storeName?: string | null;
};

export class PayPhoneError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "PayPhoneError";
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new PayPhoneError(`Falta configurar ${name}.`, "CONFIG");
  }

  return value;
}

function normalizeBearerToken(token: string) {
  return token.replace(/^Bearer\s+/i, "");
}

export function getPayPhoneConfig(): PayPhoneConfig {
  const taxMode = requiredEnv("PAYPHONE_TAX_MODE") as PayPhoneTaxMode;

  if (taxMode !== "without_tax" && taxMode !== "tax_included") {
    throw new PayPhoneError(
      "PAYPHONE_TAX_MODE debe ser without_tax o tax_included.",
      "CONFIG",
    );
  }

  const rawTaxRate = process.env.PAYPHONE_TAX_RATE?.trim() || "15";
  const taxRate = Number(rawTaxRate);

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new PayPhoneError("PAYPHONE_TAX_RATE no es válido.", "CONFIG");
  }

  return {
    // PayPhone normalmente entrega el valor sin prefijo, pero aceptar
    // opcionalmente "Bearer " evita enviar "Bearer Bearer <token>".
    token: normalizeBearerToken(requiredEnv("PAYPHONE_TOKEN")),
    storeId: requiredEnv("PAYPHONE_STORE_ID"),
    responseUrl: requiredEnv("PAYPHONE_RESPONSE_URL"),
    cancellationUrl: requiredEnv("PAYPHONE_CANCELLATION_URL"),
    taxMode,
    taxRate,
  };
}

function calculateTaxBreakdown(
  amount: number,
  config: Pick<PayPhoneConfig, "taxMode" | "taxRate">,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PayPhoneError("El monto del pedido no es válido.", "INVALID_AMOUNT");
  }

  if (config.taxMode === "without_tax") {
    return {
      amountWithoutTax: amount,
      amountWithTax: 0,
      tax: 0,
    };
  }

  const tax = Math.round((amount * config.taxRate) / (100 + config.taxRate));

  return {
    amountWithoutTax: 0,
    amountWithTax: amount - tax,
    tax,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") ?? "sin content-type";
  const rawBody = await response.text();

  try {
    const parsed: unknown = JSON.parse(rawBody.replace(/^\uFEFF/, ""));

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("La respuesta JSON no es un objeto.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    console.error("PayPhone returned a non-JSON response", {
      status: response.status,
      contentType,
      bodyPreview: rawBody.replace(/\s+/g, " ").slice(0, 240),
    });

    throw new PayPhoneError(
      `PayPhone no pudo iniciar el pago (respuesta HTTP ${response.status}).`,
      `HTTP_${response.status}`,
    );
  }
}

function providerError(body: PayPhoneErrorBody, fallback: string) {
  const message = typeof body.message === "string" ? body.message : fallback;
  const code =
    typeof body.errorCode === "number" || typeof body.errorCode === "string"
      ? String(body.errorCode)
      : undefined;

  return new PayPhoneError(message, code);
}

export async function preparePayPhonePayment(input: {
  amount: number;
  clientTransactionId: string;
  orderCode: string;
}) {
  const config = getPayPhoneConfig();
  const taxBreakdown = calculateTaxBreakdown(input.amount, config);
  const body = {
    amount: input.amount,
    ...taxBreakdown,
    service: 0,
    tip: 0,
    clientTransactionId: input.clientTransactionId,
    reference: `Pedido ${input.orderCode} - Pesca Con Fe`,
    storeId: config.storeId,
    currency: "USD",
    responseUrl: config.responseUrl,
    cancellationUrl: config.cancellationUrl,
    // PayPhone documenta este campo como texto; enviarlo como número puede
    // provocar un error de deserialización en su API.
    timeZone: "-5",
    lang: "es",
  };

  const response = await fetch(PAYPHONE_PREPARE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw providerError(data, "PayPhone no pudo preparar el pago.");
  }

  const paymentId = typeof data.paymentId === "string" ? data.paymentId : "";
  const payWithCard = typeof data.payWithCard === "string" ? data.payWithCard : "";
  const payWithPayPhone =
    typeof data.payWithPayPhone === "string" ? data.payWithPayPhone : "";

  if (!paymentId || !payWithCard || !payWithPayPhone) {
    throw new PayPhoneError("PayPhone no devolvió enlaces de pago válidos.");
  }

  return { paymentId, payWithCard, payWithPayPhone } satisfies PayPhonePrepareResult;
}

export async function confirmPayPhonePayment(input: {
  id: number;
  clientTransactionId: string;
}) {
  const config = getPayPhoneConfig();
  const response = await fetch(PAYPHONE_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: input.id,
      clientTxId: input.clientTransactionId,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await readJson(response);

  if (!response.ok || typeof data.statusCode !== "number") {
    throw providerError(data, "PayPhone no pudo confirmar el pago.");
  }

  const confirmation: PayPhoneConfirmation = {
    amount: Number(data.amount),
    clientTransactionId: String(data.clientTransactionId ?? ""),
    statusCode: data.statusCode,
    transactionStatus: String(data.transactionStatus ?? ""),
    authorizationCode:
      typeof data.authorizationCode === "string" ? data.authorizationCode : null,
    message: typeof data.message === "string" ? data.message : null,
    messageCode: typeof data.messageCode === "number" ? data.messageCode : null,
    transactionId: Number(data.transactionId),
    currency: typeof data.currency === "string" ? data.currency : null,
    storeName: typeof data.storeName === "string" ? data.storeName : null,
  };

  if (
    !Number.isInteger(confirmation.amount) ||
    !Number.isInteger(confirmation.transactionId) ||
    !confirmation.clientTransactionId
  ) {
    throw new PayPhoneError("La confirmación de PayPhone está incompleta.");
  }

  return confirmation;
}
