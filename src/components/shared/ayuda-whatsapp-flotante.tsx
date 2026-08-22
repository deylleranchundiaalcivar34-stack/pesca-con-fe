"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildGeneralSalesWhatsAppMessage,
  getWhatsAppPrefilledUrl,
} from "@/lib/whatsapp";
import { shouldShowFloatingWhatsAppHelp } from "@/lib/ayuda-whatsapp";

// Ofrece ayuda general en la tienda sin competir con la consulta propia de cada producto.
export function FloatingWhatsAppHelp() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const isOpen = openPath === pathname;
  const whatsappUrl = getWhatsAppPrefilledUrl(
    buildGeneralSalesWhatsAppMessage(),
  );
  const focusTrigger = useCallback(() => {
    widgetRef.current
      ?.querySelector<HTMLButtonElement>("[data-whatsapp-help-trigger]")
      ?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !widgetRef.current?.contains(event.target)
      ) {
        setOpenPath(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPath(null);
        focusTrigger();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [focusTrigger, isOpen]);

  if (!shouldShowFloatingWhatsAppHelp(pathname)) return null;

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-5 left-4 z-40 sm:bottom-6 sm:left-6"
    >
      {isOpen ? (
        <section
          id="general-whatsapp-help-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="general-whatsapp-help-title"
          className="absolute bottom-[calc(100%+0.75rem)] left-0 w-[min(21rem,calc(100vw-2rem))] origin-bottom-left animate-in overflow-hidden rounded-2xl border border-[#25d366]/25 bg-white shadow-[0_20px_55px_rgb(15_52_87_/_0.28)] duration-200 fade-in-0 slide-in-from-bottom-2 zoom-in-95 motion-reduce:animate-none"
        >
          <div className="relative bg-[linear-gradient(135deg,#20ba5a,#128c46)] px-5 py-4 text-white">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Cerrar ayuda de WhatsApp"
              onClick={() => {
                setOpenPath(null);
                focusTrigger();
              }}
              className="absolute right-2 top-2 size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
            >
              <X aria-hidden="true" />
            </Button>

            <div className="flex items-start gap-3 pr-8">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/35">
                <Image
                  src="/images/redes-sociales/whatsapp-icon.webp"
                  alt=""
                  width={34}
                  height={34}
                  aria-hidden="true"
                  className="size-8 object-contain"
                />
              </span>
              <div>
                <h2
                  id="general-whatsapp-help-title"
                  className="text-lg font-bold leading-tight"
                >
                  ¿Necesitas ayuda?
                </h2>
                <p className="mt-1 text-sm leading-5 text-white/90">
                  Comunícate con nuestro Departamento de Ventas.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              Atención 12 horas al día, de lunes a viernes.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-[#25d366]/25 bg-[#25d366]/[0.07] p-3 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#25d366]/55 hover:bg-[#25d366]/[0.12] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
              aria-label="Iniciar conversación por WhatsApp con el Departamento de Ventas"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#25d366]/25">
                <Image
                  src="/images/redes-sociales/whatsapp-icon.webp"
                  alt=""
                  width={32}
                  height={32}
                  aria-hidden="true"
                  className="size-8 object-contain"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-dark-blue">
                  Departamento de Ventas
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Iniciar conversación por WhatsApp
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 text-[#128c46] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </a>
          </div>
        </section>
      ) : null}

      <div className="group relative flex items-center">
        <Button
          data-whatsapp-help-trigger
          type="button"
          size="icon"
          aria-label={isOpen ? "Cerrar ayuda de WhatsApp" : "Abrir ayuda de WhatsApp"}
          aria-expanded={isOpen}
          aria-controls="general-whatsapp-help-panel"
          onClick={() => setOpenPath((current) => (current === pathname ? null : pathname))}
          className="general-whatsapp-help-button relative size-12 rounded-full border border-white/70 bg-[#25d366] text-white shadow-[0_18px_40px_rgb(18_140_70_/_0.28)] ring-1 ring-[#128c46]/15 hover:bg-[#20ba5a] focus-visible:ring-[#25d366] focus-visible:ring-offset-2"
        >
          {isOpen ? (
            <X aria-hidden="true" className="!size-6" />
          ) : (
            <Image
              src="/images/redes-sociales/whatsapp-icon.webp"
              alt=""
              width={34}
              height={34}
              aria-hidden="true"
              className="size-8 object-contain"
            />
          )}
        </Button>

        {!isOpen ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[calc(100%+0.65rem)] hidden whitespace-nowrap rounded-lg border border-border/80 bg-white px-3 py-2 text-xs text-dark-blue opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-within:translate-x-0.5 group-focus-within:opacity-100 motion-reduce:transition-none sm:block"
          >
            ¿Necesitas ayuda? <strong>Chatea con nosotros</strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}
