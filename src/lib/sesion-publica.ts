"use client";

import type { PublicUserSummary } from "@/types/usuario";

const publicSessionEventName = "pesca-con-fe:sesion-publica";

const publicSessionFreshnessMs = 30_000;

type PublicSessionState = {
  status: "loading" | "ready";
  user: PublicUserSummary | null;
};

type SessionResponse = {
  user: PublicUserSummary | null;
};

type PublicSessionEventDetail = {
  user?: PublicUserSummary | null;
};

const serverSessionSnapshot: PublicSessionState = {
  status: "loading",
  user: null,
};

let publicSessionSnapshot = serverSessionSnapshot;
let lastSessionSyncAt = 0;
let sessionRequestVersion = 0;
let sessionPromise: Promise<PublicUserSummary | null> | null = null;
const sessionListeners = new Set<() => void>();

function publishPublicSession(user: PublicUserSummary | null) {
  publicSessionSnapshot = { status: "ready", user };
  sessionListeners.forEach((listener) => listener());
}

export function subscribePublicSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function getPublicSessionSnapshot() {
  return publicSessionSnapshot;
}

export function getPublicSessionServerSnapshot() {
  return serverSessionSnapshot;
}

// Actualiza inmediatamente el estado compartido y descarta respuestas antiguas.
export function setPublicSessionUser(user: PublicUserSummary | null) {
  sessionRequestVersion += 1;
  lastSessionSyncAt = Date.now();
  publishPublicSession(user);
}

// Revalida la cuenta sin borrar el usuario visible mientras llega la respuesta.
export function refreshPublicSession({ force = false }: { force?: boolean } = {}) {
  const sessionIsFresh =
    publicSessionSnapshot.status === "ready" &&
    Date.now() - lastSessionSyncAt < publicSessionFreshnessMs;

  if (!force && sessionIsFresh) {
    return Promise.resolve(publicSessionSnapshot.user);
  }

  if (sessionPromise) return sessionPromise;

  const requestVersion = sessionRequestVersion + 1;
  sessionRequestVersion = requestVersion;

  sessionPromise = fetch("/api/sesion", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("No se pudo consultar la sesion publica.");
      const data = (await response.json()) as SessionResponse;
      return data.user ?? null;
    })
    .then((user) => {
      if (requestVersion === sessionRequestVersion) {
        lastSessionSyncAt = Date.now();
        publishPublicSession(user);
      }

      return user;
    })
    .catch(() => {
      if (
        requestVersion === sessionRequestVersion &&
        publicSessionSnapshot.status === "loading"
      ) {
        publishPublicSession(null);
      }

      return publicSessionSnapshot.user;
    })
    .finally(() => {
      sessionPromise = null;
    });

  return sessionPromise;
}

// Avisa a los controles del header que deben refrescar la cuenta visible.
export function notifyPublicSessionChange(user?: PublicUserSummary | null) {
  if (user !== undefined) {
    setPublicSessionUser(user);

    // Tras el login conserva el nombre disponible y completa datos como isAdmin.
    if (user) void refreshPublicSession({ force: true });
  } else {
    void refreshPublicSession({ force: true });
  }

  window.dispatchEvent(
    new CustomEvent<PublicSessionEventDetail>(publicSessionEventName, {
      detail: { user },
    }),
  );
}
