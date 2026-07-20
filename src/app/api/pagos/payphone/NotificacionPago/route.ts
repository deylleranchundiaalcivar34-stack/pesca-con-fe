import { NextResponse, type NextRequest } from "next/server";
import { getPayPhoneConfig } from "@/lib/payphone";
import { processPayPhoneConfirmation } from "@/lib/payphone-confirmation";
import { consumeRateLimit, getRequestAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const responseHeaders = { "Cache-Control": "no-store" };

function payPhoneResponse(ok: boolean, errorCode: "000" | "111" | "222" | "333" | "444" | "666") {
  return NextResponse.json(
    { Response: ok, ErrorCode: errorCode },
    { status: 200, headers: responseHeaders },
  );
}

// PayPhone no firma la notificación externa. Por eso el payload jamás se toma
// como prueba: solo dispara una consulta autenticada al endpoint Confirm oficial.
export async function POST(request: NextRequest) {
  const allowed = await consumeRateLimit({
    bucket: "payphone.webhook",
    identifier: getRequestAddress(request.headers),
    max: 300,
    windowSeconds: 60,
  });
  if (!allowed) return payPhoneResponse(false, "222");

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > 16_384) {
    return payPhoneResponse(false, "111");
  }

  let body: Record<string, unknown>;

  try {
    const raw = await request.text();
    if (!raw || raw.length > 16_384) return payPhoneResponse(false, "111");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return payPhoneResponse(false, "111");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return payPhoneResponse(false, "111");
  }

  const transactionId = Number(body.TransactionId);
  const clientTransactionId =
    typeof body.ClientTransactionId === "string" ? body.ClientTransactionId.trim() : "";
  const storeId = typeof body.StoreId === "string" ? body.StoreId.trim() : "";

  if (
    !Number.isSafeInteger(transactionId) ||
    transactionId <= 0 ||
    !/^PCF-[a-f0-9]{32}$/i.test(clientTransactionId) ||
    Number(body.StatusCode) !== 3 ||
    body.TransactionStatus !== "Approved"
  ) {
    return payPhoneResponse(false, "444");
  }

  try {
    if (!storeId || storeId !== getPayPhoneConfig().storeId) {
      return payPhoneResponse(false, "666");
    }

    const result = await processPayPhoneConfirmation({
      id: transactionId,
      clientTransactionId,
    });

    if (result.state === "error") return payPhoneResponse(false, "222");
    if (result.state === "review") return payPhoneResponse(false, "333");

    // "queued" ya quedó persistido y será reintentado por reconciliación.
    return payPhoneResponse(true, "000");
  } catch {
    return payPhoneResponse(false, "222");
  }
}
