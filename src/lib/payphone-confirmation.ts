import "server-only";

import { confirmPayPhonePayment } from "@/lib/payphone";
import { createAdminClient } from "@/lib/supabase/admin";

type StoredPayPhoneAttempt = {
  pedido_id: string;
  pedido_codigo: string;
  provider_transaction_id: number | null;
  estado: string;
  monto_centavos: number;
  moneda: string;
};

export type PayPhoneProcessingResult = {
  state: "approved" | "canceled" | "error" | "queued" | "review";
  orderCode?: string;
};

function isMissingDurableRpc(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    (message.includes("function") && message.includes("not found"))
  );
}

// El retorno del navegador, el webhook y el cron convergen aquí. Los parámetros
// recibidos son solo una señal: el estado y el monto se vuelven a consultar a PayPhone.
export async function processPayPhoneConfirmation(input: {
  id: number;
  clientTransactionId: string;
}): Promise<PayPhoneProcessingResult> {
  const admin = createAdminClient();
  const { data: signalState, error: signalError } = await admin.rpc(
    "registrar_senal_payphone_servidor",
    {
      client_transaction_id_input: input.clientTransactionId,
      provider_payment_id_input: input.id,
    },
  );
  const durableSignalAvailable = !isMissingDurableRpc(signalError);

  if (
    (signalError && durableSignalAvailable) ||
    signalState === "invalida" ||
    signalState === "no_encontrada"
  ) {
    return { state: "error" };
  }

  if (signalState === "conflicto") {
    return { state: "review" };
  }

  const { data: attempt, error: attemptError } = await admin
    .rpc("obtener_intento_payphone", {
      client_transaction_id_input: input.clientTransactionId,
    })
    .single<StoredPayPhoneAttempt>();

  if (attemptError || !attempt) {
    return { state: "error" };
  }

  if (
    attempt.estado === "aprobado" &&
    Number(attempt.provider_transaction_id) === input.id
  ) {
    return { state: "approved", orderCode: attempt.pedido_codigo };
  }

  try {
    const confirmation = await confirmPayPhonePayment({
      id: input.id,
      clientTransactionId: input.clientTransactionId,
    });
    const matches =
      confirmation.clientTransactionId === input.clientTransactionId &&
      confirmation.transactionId === input.id &&
      confirmation.amount === Number(attempt.monto_centavos) &&
      (!confirmation.currency || confirmation.currency === attempt.moneda);

    if (!matches) {
      if (durableSignalAvailable) {
        await admin.rpc("marcar_revision_payphone_servidor", {
          client_transaction_id_input: input.clientTransactionId,
          provider_payment_id_input: input.id,
          motivo_input: "La confirmación del proveedor no coincide con el intento local",
        });
      }
      return { state: "review", orderCode: attempt.pedido_codigo };
    }

    if (confirmation.statusCode === 3 && confirmation.transactionStatus === "Approved") {
      const { error: finalizeError } = await admin.rpc("finalizar_pago_payphone", {
        client_transaction_id_input: input.clientTransactionId,
        provider_payment_id_input: input.id,
        monto_centavos_input: confirmation.amount,
        store_id_input: null,
        codigo_autorizacion_input: confirmation.authorizationCode ?? null,
      });

      if (finalizeError) {
        if (durableSignalAvailable) {
          await admin.rpc("marcar_revision_payphone_servidor", {
            client_transaction_id_input: input.clientTransactionId,
            provider_payment_id_input: input.id,
            motivo_input: "PayPhone aprobó, pero la finalización local requiere revisión",
          });
        }
        return { state: "review", orderCode: attempt.pedido_codigo };
      }

      return { state: "approved", orderCode: attempt.pedido_codigo };
    }

    const canceled =
      confirmation.statusCode === 2 || confirmation.transactionStatus === "Canceled";
    await admin.rpc("cancelar_intento_payphone", {
      client_transaction_id_input: input.clientTransactionId,
      estado_input: canceled ? "cancelado" : "fallido",
      codigo_error_input: confirmation.messageCode?.toString() ?? null,
      mensaje_error_input: confirmation.message?.slice(0, 500) ?? null,
    });

    return {
      state: canceled ? "canceled" : "error",
      orderCode: attempt.pedido_codigo,
    };
  } catch (error) {
    if (durableSignalAvailable) {
      await admin.rpc("marcar_fallo_confirmacion_payphone_servidor", {
        client_transaction_id_input: input.clientTransactionId,
        motivo_input: error instanceof Error ? error.name : "UnknownError",
      });
      return { state: "queued", orderCode: attempt.pedido_codigo };
    }

    // Durante el despliegue app-first no se confirma la recepción del webhook
    // si aún no existe almacenamiento durable; PayPhone podrá reintentarlo.
    return { state: "error", orderCode: attempt.pedido_codigo };
  }
}
