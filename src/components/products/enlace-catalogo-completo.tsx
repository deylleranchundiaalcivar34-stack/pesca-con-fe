"use client";

import type { ComponentProps } from "react";
import Link from "next/link";

type FullCatalogLinkProps = Omit<ComponentProps<typeof Link>, "href">;

// Next conserva el estado cuando el destino comparte pathname. Este enlace
// garantiza que volver al catálogo elimine búsqueda, filtros, orden y página.
export function FullCatalogLink({ onClick, ...props }: FullCatalogLinkProps) {
  return (
    <Link
      {...props}
      href="/productos"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (
          window.location.pathname !== "/productos" ||
          (!window.location.search && !window.location.hash)
        ) {
          return;
        }

        event.preventDefault();
        window.history.pushState(null, "", "/productos");
      }}
    />
  );
}
