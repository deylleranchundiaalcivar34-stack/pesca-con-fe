import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { processPayPhoneConfirmation } from "@/lib/payphone-confirmation";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ReconciliationAttempt = {
  client_transaction_id: string;
  provider_payment_id: number;
};

function validCronAuthorization(value: string | null) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || !value) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(value);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: NextRequest) {
  if (!validCronAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  await admin.rpc("expirar_intentos_payphone_servidor");
  await admin.rpc("limpiar_limites_frecuencia_servidor");
  const { data, error } = await admin.rpc("listar_intentos_payphone_reconciliar_servidor", {
    limite_input: 25,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const attempts = (data ?? []) as ReconciliationAttempt[];
  const results = [];

  for (const attempt of attempts) {
    const result = await processPayPhoneConfirmation({
      id: Number(attempt.provider_payment_id),
      clientTransactionId: attempt.client_transaction_id,
    });
    results.push(result.state);
  }

  return NextResponse.json(
    {
      ok: true,
      processed: results.length,
      approved: results.filter((state) => state === "approved").length,
      queued: results.filter((state) => state === "queued").length,
      review: results.filter((state) => state === "review").length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
