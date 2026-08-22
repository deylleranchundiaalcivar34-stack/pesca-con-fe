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

const DISMISSAL_KEY = "pesca-con-fe:promocion-bienvenida-cerrada:v2";
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const EXCLUDED_PATHS = ["/login", "/checkout", "/mi-cuenta", "/recuperar-contrasena", "/restablecer-contrasena"];

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
  const canShow =
    session.status === "ready" &&
    !session.user &&
    !isExcluded &&
    !wasRecentlyDismissed();

  useEffect(() => {
    if (!canShow) return;

    const timer = window.setTimeout(() => setOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, [canShow]);

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) rememberDismissal();
  };

  return (
    <DialogPrimitive.Root open={open && canShow} onOpenChange={changeOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[91] max-h-[92svh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#d9b84f] bg-[#0a0a0a] text-white shadow-[0_24px_90px_rgb(0_0_0_/_0.55)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgb(236_197_80_/_0.24),transparent_70%)]" />
          <div className="relative p-4 sm:p-8">
            <DialogPrimitive.Close
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-[#ecc550] hover:text-[#ecc550] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecc550] sm:right-5 sm:top-5"
              aria-label="Cerrar promoción"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>

            <div className="inline-flex rounded-xl bg-white px-3 py-2 shadow-sm">
              <Image
                src="/images/logos/logo-nuevo-negro.webp"
                alt="Pesca Con Fe"
                width={382}
                height={187}
                className="h-8 w-auto object-contain sm:h-12"
              />
            </div>

            <div className="mt-4 grid items-center gap-4 sm:mt-6 sm:grid-cols-[1fr_auto] sm:gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ecc550]/50 bg-[#ecc550]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f6e3a1]">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Beneficio de bienvenida
                </div>
                <DialogPrimitive.Title className="mt-3 text-2xl font-black leading-tight text-white sm:mt-4 sm:text-4xl">
                  Tu primera aventura comienza con descuento
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  className="mt-2 text-[13px] leading-5 text-white/75 sm:mt-3 sm:text-base sm:leading-6"
                >
                  Crea tu cuenta y recibe automáticamente el beneficio al completar tu primera compra elegible.
                </DialogPrimitive.Description>
              </div>

              <div className="mx-auto flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-2 border-[#ecc550] bg-[#ecc550] text-center text-black shadow-[0_0_45px_rgb(236_197_80_/_0.22)] sm:size-40">
                <BadgePercent className="size-6 sm:size-7" aria-hidden="true" />
                <span className="mt-1 text-4xl font-black leading-none sm:text-5xl">10%</span>
                <span className="mt-1 text-xs font-black uppercase tracking-[0.2em]">de descuento</span>
              </div>
            </div>

            <div className="mt-4 grid gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] p-3 text-xs text-white/85 sm:mt-6 sm:grid-cols-3 sm:gap-4 sm:p-4 sm:text-sm">
              <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#ecc550]" aria-hidden="true" />Compra mínima de $50</p>
              <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#ecc550]" aria-hidden="true" />Descuento máximo $10</p>
              <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#ecc550]" aria-hidden="true" />Una vez por cliente</p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3">
              <DialogPrimitive.Close asChild>
                <Link
                  href="/login?mode=register"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#ecc550] px-4 py-2.5 text-center text-sm font-black text-black transition hover:bg-[#f6e3a1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecc550] sm:min-h-12 sm:px-5 sm:py-3 sm:text-base"
                >
                  Crear mi cuenta y obtener el beneficio
                </Link>
              </DialogPrimitive.Close>
              <DialogPrimitive.Close className="min-h-11 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10 sm:min-h-12 sm:px-5 sm:py-3 sm:text-base">
                Seguir explorando
              </DialogPrimitive.Close>
            </div>

            <p className="mt-3 text-center text-[10px] leading-4 text-white/55 sm:mt-4 sm:text-xs sm:leading-5">
              No acumulable con otras promociones. Aplica solo al valor de los productos; no incluye envío ni recargos de pago.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
