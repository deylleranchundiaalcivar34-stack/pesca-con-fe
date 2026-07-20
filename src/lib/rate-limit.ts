import "server-only";

import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function getRequestAddress(headers: { get(name: string): string | null }) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

function hashIdentifier(identifier: string) {
  const secret = process.env.RATE_LIMIT_SECRET?.trim();

  if (!secret && process.env.NODE_ENV !== "production") {
    return createHmac("sha256", "pescaconfe-local-rate-limit-only")
      .update(identifier)
      .digest("hex");
  }

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) return null;
  return createHmac("sha256", secret).update(identifier).digest("hex");
}

function canBypassDurableRateLimit() {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production";
}

export async function consumeRateLimit(input: {
  bucket: string;
  identifier: string;
  max: number;
  windowSeconds: number;
}) {
  const hash = hashIdentifier(input.identifier);
  if (!hash) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consumir_limite_frecuencia_servidor", {
      bucket_input: input.bucket,
      clave_hash_input: hash,
      maximo_input: input.max,
      ventana_segundos_input: input.windowSeconds,
    });

    if (error) {
      console.error("Durable rate limit unavailable", {
        bucket: input.bucket,
        code: error.code,
      });
      return canBypassDurableRateLimit();
    }

    return data === true;
  } catch (error) {
    console.error("Durable rate limit unavailable", {
      bucket: input.bucket,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return canBypassDurableRateLimit();
  }
}
