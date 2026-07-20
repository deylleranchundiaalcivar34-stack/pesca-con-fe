import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, rpcMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("server-only", () => ({}));

import { consumeRateLimit } from "./rate-limit";

const request = {
  bucket: "session",
  identifier: "127.0.0.1",
  max: 10,
  windowSeconds: 60,
};

describe("limitador durable", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_SECRET", "x".repeat(32));
    createAdminClientMock.mockReturnValue({ rpc: rpcMock });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("permite continuar en Preview si faltan las credenciales administrativas", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    createAdminClientMock.mockImplementation(() => {
      throw new Error("Missing Supabase server credentials.");
    });

    await expect(consumeRateLimit(request)).resolves.toBe(true);
  });

  it("falla de forma cerrada en producción si faltan las credenciales", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    createAdminClientMock.mockImplementation(() => {
      throw new Error("Missing Supabase server credentials.");
    });

    await expect(consumeRateLimit(request)).resolves.toBe(false);
  });

  it("permite continuar en Preview si la RPC no está disponible", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    rpcMock.mockResolvedValue({ data: null, error: { code: "PGRST202" } });

    await expect(consumeRateLimit(request)).resolves.toBe(true);
  });

  it("falla de forma cerrada en producción si la RPC no está disponible", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    rpcMock.mockResolvedValue({ data: null, error: { code: "PGRST202" } });

    await expect(consumeRateLimit(request)).resolves.toBe(false);
  });

  it("respeta la decisión de la RPC cuando está disponible", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    rpcMock.mockResolvedValue({ data: true, error: null });

    await expect(consumeRateLimit(request)).resolves.toBe(true);
  });
});
