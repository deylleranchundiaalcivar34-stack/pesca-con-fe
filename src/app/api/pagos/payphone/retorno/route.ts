import { NextRequest, NextResponse } from "next/server";
import { confirmPayPhonePayment } from "@/lib/payphone";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type StoredPayPhoneAttempt = {
  pedido_id: string;
  pedido_codigo: string;
  cliente_id: string;
  provider_prepare_id: string | null;
  provider_transaction_id: number | null;
  estado: string;
  monto_centavos: number;
  moneda: string;
  expira_en: string;
};

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
    const admin = createAdminClient();
    const { data: attempt, error: attemptError } = await admin
      .rpc("obtener_intento_payphone", {
        client_transaction_id_input: clientTransactionId,
      })
      .single<StoredPayPhoneAttempt>();

    if (attemptError || !attempt) {
      console.error("PayPhone callback attempt lookup failed");
      return resultRedirect(request, "error");
    }

    if (
      attempt.estado === "aprobado" &&
      Number(attempt.provider_transaction_id) === transactionId
    ) {
      return resultRedirect(request, "aprobado", attempt.pedido_codigo);
    }

    if (attempt.estado !== "preparado") {
      return resultRedirect(
        request,
        attempt.estado === "cancelado" ? "cancelado" : "error",
        attempt.pedido_codigo,
      );
    }

    const confirmation = await confirmPayPhonePayment({
      id: transactionId,
      clientTransactionId,
    });
    const confirmationMatches =
      confirmation.clientTransactionId === clientTransactionId &&
      confirmation.transactionId === transactionId &&
      confirmation.amount === Number(attempt.monto_centavos) &&
      (!confirmation.currency || confirmation.currency === attempt.moneda);

    if (!confirmationMatches) {
      console.error("PayPhone callback confirmation mismatch");
      return resultRedirect(request, "error", attempt.pedido_codigo);
    }

    if (confirmation.statusCode === 3 && confirmation.transactionStatus === "Approved") {
      const { error: finalizeError } = await admin.rpc("finalizar_pago_payphone", {
        client_transaction_id_input: clientTransactionId,
        provider_payment_id_input: transactionId,
        monto_centavos_input: confirmation.amount,
        store_id_input: null,
        codigo_autorizacion_input: confirmation.authorizationCode ?? null,
      });

      if (finalizeError) {
        console.error("PayPhone payment database finalization failed");
        return resultRedirect(request, "error", attempt.pedido_codigo);
      }

      return resultRedirect(request, "aprobado", attempt.pedido_codigo);
    }

    const canceled =
      confirmation.statusCode === 2 || confirmation.transactionStatus === "Canceled";
    await admin.rpc("cancelar_intento_payphone", {
      client_transaction_id_input: clientTransactionId,
      estado_input: canceled ? "cancelado" : "fallido",
      codigo_error_input:
        confirmation.messageCode == null ? null : String(confirmation.messageCode),
      mensaje_error_input: confirmation.message ?? "Pago no aprobado por PayPhone.",
    });

    return resultRedirect(
      request,
      canceled ? "cancelado" : "error",
      attempt.pedido_codigo,
    );
  } catch (error) {
    console.error(
      "PayPhone callback failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return resultRedirect(request, "error");
  }
}
