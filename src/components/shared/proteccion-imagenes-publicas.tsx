"use client";

import { useEffect } from "react";

const allowedImageActionsSelector = "[data-allow-image-actions]";

function isProtectedPublicImage(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  const image = target.closest("img");
  return Boolean(image && !image.closest(allowedImageActionsSelector));
}

/** Reduce la copia casual de imagenes en las paginas publicas sin alterar sus enlaces. */
export function PublicImageProtection() {
  useEffect(() => {
    const preventImageAction = (event: Event) => {
      if (isProtectedPublicImage(event.target)) event.preventDefault();
    };

    document.body.dataset.publicImageProtection = "enabled";
    document.addEventListener("contextmenu", preventImageAction, true);
    document.addEventListener("dragstart", preventImageAction, true);

    return () => {
      delete document.body.dataset.publicImageProtection;
      document.removeEventListener("contextmenu", preventImageAction, true);
      document.removeEventListener("dragstart", preventImageAction, true);
    };
  }, []);

  return null;
}
