"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BadgePercent, Check, Sparkles, X } from "lucide-react";
import {
  getPublicSessionServerSnapshot,
  getPublicSessionSnapshot,
  refreshPublicSession,
  subscribePublicSession,
} from "@/lib/sesion-publica";
import { isWelcomePromotionActive, WELCOME_PROMOTION } from "@/lib/promocion-bienvenida";

const DISMISSAL_KEY = "pesca-con-fe:promocion-bienvenida-cerrada:v3";
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const EXCLUDED_PATHS = [
  "/login",
  "/checkout",
  "/mi-cuenta",
  "/recuperar-contrasena",
  "/restablecer-contrasena",
];

function wasRecentlyDismissed() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISSAL_KEY));
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISSAL_DURATION_MS;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
  } catch {
    // La privacidad del navegador puede impedir localStorage; cerrar sigue funcionando.
  }
}

export function WelcomePromotionPopup() {
  const pathname = usePathname();
  const session = useSyncExternalStore(
    subscribePublicSession,
    getPublicSessionSnapshot,
    getPublicSessionServerSnapshot,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void refreshPublicSession();
  }, []);

  const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
  const canOffer =
    session.status === "ready" &&
    !session.user &&
    !isExcluded &&
    isWelcomePromotionActive();
  const canAutoOpen = canOffer && !wasRecentlyDismissed();

  useEffect(() => {
    if (!canAutoOpen) return;

    const timer = window.setTimeout(() => setOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, [canAutoOpen]);

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) rememberDismissal();
  };

  return (
    <>
      <DialogPrimitive.Root open={open && canOffer} onOpenChange={changeOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-[3px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[91] max-h-[92svh] w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#d9b84f] bg-[#080808] text-white shadow-[0_28px_100px_rgb(0_0_0_/_0.68)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <DialogPrimitive.Close
              className="absolute right-3 top-3 z-30 flex size-10 items-center justify-center rounded-full border border-white/35 bg-black/65 text-white shadow-lg backdrop-blur transition hover:border-[#ecc550] hover:text-[#ecc550] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecc550] sm:right-5 sm:top-5"
              aria-label="Cerrar promoción"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>

            <div className="grid md:grid-cols-[1.12fr_0.88fr]">
              <div className="relative h-36 overflow-hidden border-b border-[#ecc550]/35 md:order-2 md:h-auto md:min-h-[570px] md:border-b-0 md:border-l">
                <Image
                  src="/images/promociones/pescador-bienvenida.webp"
                  alt="Pescador de Pesca Con Fe con una captura deportiva"
                  fill
                  loading="eager"
                  sizes="(max-width: 767px) calc(100vw - 1.5rem), 40vw"
                  className="object-cover object-[center_38%] md:object-contain md:object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-black/10 to-black/20 md:bg-gradient-to-r md:from-[#080808]/80 md:via-transparent md:to-transparent" />
                <div className="absolute bottom-3 left-4 rounded-full border border-[#ecc550]/70 bg-black/75 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#f6e3a1] backdrop-blur md:bottom-6 md:left-auto md:right-6">
                  Fe, pasión y naturaleza
                </div>
              </div>

              <div className="relative p-4 sm:p-6 md:p-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgb(236_197_80_/_0.18),transparent_72%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3 pr-11 md:pr-0">
                    <div className="inline-flex rounded-xl bg-white px-3 py-1.5 shadow-sm">
                      <Image
                        src="/images/logos/logo-nuevo-negro.webp"
                        alt="Pesca Con Fe"
                        width={382}
                        height={187}
                        className="h-8 w-auto object-contain sm:h-10"
                      />
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-[#ecc550]/50 bg-[#ecc550]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6e3a1] sm:inline-flex">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Beneficio exclusivo
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ecc550]/50 bg-[#ecc550]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f6e3a1] sm:hidden">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Beneficio exclusivo
                  </div>

                  <DialogPrimitive.Title className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl md:mt-5 md:text-4xl">
                    ¡Bienvenido a Pesca Con Fe!
                  </DialogPrimitive.Title>

                  <div className="mt-2 flex items-end gap-3 border-b border-[#ecc550]/40 pb-3 md:mt-4 md:pb-4">
                    <span className="bg-gradient-to-b from-[#f8dc7b] to-[#d79a16] bg-clip-text text-6xl font-black leading-none text-transparent sm:text-7xl">
                      10%
                    </span>
                    <span className="pb-1 text-lg font-black uppercase leading-[1.05] text-white sm:text-2xl">
                      de
                      <br />
                      descuento
                    </span>
                  </div>

                  <DialogPrimitive.Description className="mt-3 text-sm leading-5 text-white/78 sm:leading-6 md:mt-4 md:text-base">
                    Crea tu cuenta y recibe automáticamente un beneficio exclusivo en tu primera compra elegible.
                  </DialogPrimitive.Description>

                  <div className="mt-3 grid gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] p-3 text-xs text-white/85 sm:grid-cols-3 sm:gap-3 md:mt-5 md:text-sm">
                    <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#ecc550]" aria-hidden="true" />Compra mínima de $50</p>
                    <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#ecc550]" aria-hidden="true" />Descuento máximo $10</p>
                    <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#ecc550]" aria-hidden="true" />Una vez por cliente</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row md:mt-5">
                    <DialogPrimitive.Close asChild>
                      <Link
                        href="/login?mode=register"
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#ecc550] px-4 py-2.5 text-center text-sm font-black text-black transition hover:bg-[#f6e3a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecc550] sm:min-h-12 sm:text-base"
                      >
                        Quiero mi beneficio
                      </Link>
                    </DialogPrimitive.Close>
                    <DialogPrimitive.Close className="min-h-11 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10 sm:min-h-12">
                      Ahora no
                    </DialogPrimitive.Close>
                  </div>

                  <p className="mt-3 text-center text-[10px] leading-4 text-white/55 sm:text-xs sm:leading-5">
                    No acumulable con otras promociones. Aplica solo a productos; no incluye envío ni recargos de pago.
                  </p>
                  <p className="mt-1.5 text-center text-[10px] leading-4 text-white/65 sm:text-xs sm:leading-5">
                    Vigente hasta el {WELCOME_PROMOTION.endDateLabel} ·{" "}
                    <Link
                      href="/preguntas-frecuentes#promocion-bienvenida"
                      className="font-semibold text-[#f6e3a1] underline decoration-[#ecc550]/70 underline-offset-2 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecc550]"
                    >
                      Ver términos de la promoción
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {canOffer && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-[5.25rem] left-4 z-[39] flex size-12 items-center justify-center rounded-full bg-[#ecc550] text-black shadow-[0_3px_10px_rgb(0_0_0_/_0.18)] transition hover:bg-[#f6d86f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07366f] sm:left-6"
          aria-label="Abrir promoción de bienvenida con 10% de descuento"
          title="10% de descuento de bienvenida"
        >
          <svg
            className="pointer-events-none absolute inset-0 size-12 -rotate-90"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="21" fill="none" stroke="rgb(0 0 0 / 0.14)" strokeWidth="2" />
            <circle
              className="welcome-promotion-clock-ring"
              cx="24"
              cy="24"
              r="21"
              fill="none"
              pathLength="1"
              stroke="#fff2b5"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <span className="relative flex size-9 items-center justify-center rounded-full">
            <BadgePercent className="size-6" aria-hidden="true" />
          </span>
          <span className="pointer-events-none absolute left-14 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#090909] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
            10% de descuento de bienvenida
          </span>
        </button>
      ) : null}
    </>
  );
}
