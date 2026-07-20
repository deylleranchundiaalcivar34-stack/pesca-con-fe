import { NextRequest, NextResponse } from "next/server";
import { processPayPhoneConfirmation } from "@/lib/payphone-confirmation";
import { consumeRateLimit, getRequestAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

function resultRedirect(
  request: NextRequest,
  state: "aprobado" | "cancelado" | "error",
  orderCode?: string,
) {
  const url = new URL("/checkout/resultado", request.url);
  url.searchParams.set("estado", state);

  if (orderCode) {
    url.searchParams.set("pedido", orderCode);
  }

  return NextResponse.redirect(url);
}

// PayPhone redirige aquí con id y clientTransactionId. La respuesta del
// navegador nunca se considera prueba de pago: el servidor consulta Confirm.
export async function GET(request: NextRequest) {
  const allowed = await consumeRateLimit({
    bucket: "payphone.return",
    identifier: getRequestAddress(request.headers),
    max: 60,
    windowSeconds: 60,
  });

  if (!allowed) return resultRedirect(request, "error");

  const idValue = request.nextUrl.searchParams.get("id") ?? "";
  const clientTransactionId =
    request.nextUrl.searchParams.get("clientTransactionId")?.trim() ?? "";
  const transactionId = Number(idValue);

  if (
    !Number.isSafeInteger(transactionId) ||
    transactionId <= 0 ||
    !clientTransactionId ||
    clientTransactionId.length > 50
  ) {
    return resultRedirect(request, "error");
  }

  try {
    const result = await processPayPhoneConfirmation({
      id: transactionId,
      clientTransactionId,
    });

    return resultRedirect(
      request,
      result.state === "approved"
        ? "aprobado"
        : result.state === "canceled"
          ? "cancelado"
          : "error",
      result.orderCode,
    );
  } catch (error) {
    console.error(
      "PayPhone callback failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return resultRedirect(request, "error");
  }
}
