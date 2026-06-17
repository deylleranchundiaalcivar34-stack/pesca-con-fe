"use client";

import type { PublicUserSummary } from "@/types/usuario";

export const publicSessionEventName = "pesca-con-fe:sesion-publica";

type PublicSessionEventDetail = {
  user?: PublicUserSummary | null;
};

// Avisa a los controles del header que deben refrescar la cuenta visible.
export function notifyPublicSessionChange(user?: PublicUserSummary | null) {
  window.dispatchEvent(
    new CustomEvent<PublicSessionEventDetail>(publicSessionEventName, {
      detail: { user },
    }),
  );
}
