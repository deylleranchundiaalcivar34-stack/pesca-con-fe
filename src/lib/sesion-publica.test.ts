import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicUserSummary } from "@/types/usuario";

const user: PublicUserSummary = {
  id: "user-1",
  email: "usuario@example.com",
  firstName: "Paul",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("estado de la sesión pública", () => {
  it("conserva el usuario y evita otra consulta durante una navegación inmediata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const session = await import("./sesion-publica");

    expect(session.getPublicSessionServerSnapshot()).toEqual({
      status: "loading",
      user: null,
    });

    await session.refreshPublicSession();
    await session.refreshPublicSession();

    expect(session.getPublicSessionSnapshot()).toEqual({ status: "ready", user });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("no reemplaza un cierre de sesión con una respuesta anterior", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pendingResponse));

    const session = await import("./sesion-publica");
    const pendingRefresh = session.refreshPublicSession();

    session.setPublicSessionUser(null);
    resolveRequest?.(
      new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await pendingRefresh;

    expect(session.getPublicSessionSnapshot()).toEqual({
      status: "ready",
      user: null,
    });
  });

  it("mantiene el usuario visible si falla una revalidación en segundo plano", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const session = await import("./sesion-publica");

    session.setPublicSessionUser(user);
    await session.refreshPublicSession({ force: true });

    expect(session.getPublicSessionSnapshot()).toEqual({ status: "ready", user });
  });
});
