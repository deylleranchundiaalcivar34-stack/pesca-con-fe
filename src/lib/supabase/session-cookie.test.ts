import { describe, expect, it } from "vitest";
import { hasSupabaseAuthCookie } from "./session-cookie";

describe("hasSupabaseAuthCookie", () => {
  it("detecta cookies completas y divididas de Supabase", () => {
    expect(hasSupabaseAuthCookie([{ name: "sb-demo-auth-token" }])).toBe(true);
    expect(hasSupabaseAuthCookie([{ name: "sb-demo-auth-token.0" }])).toBe(true);
  });

  it("ignora cookies que no representan una sesión", () => {
    expect(
      hasSupabaseAuthCookie([
        { name: "cookie-consent" },
        { name: "sb-demo-verifier" },
      ]),
    ).toBe(false);
  });
});
