import "server-only";

import { randomUUID } from "node:crypto";

export class PublicServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicServerError";
  }
}

export function reportServerError(context: string, error: unknown) {
  const correlationId = randomUUID();
  const details =
    error && typeof error === "object"
      ? {
          name: "name" in error ? String(error.name).slice(0, 80) : "Error",
          code: "code" in error ? String(error.code).slice(0, 80) : undefined,
          message:
            "message" in error
              ? String(error.message).replace(/[\r\n]+/g, " ").slice(0, 300)
              : undefined,
        }
      : { name: "UnknownError" };

  console.error(context, { correlationId, ...details });
  return correlationId;
}

export function publicServerError(
  context: string,
  error: unknown,
  publicMessage: string,
) {
  const correlationId = reportServerError(context, error);
  return new PublicServerError(`${publicMessage} Referencia: ${correlationId}`);
}
