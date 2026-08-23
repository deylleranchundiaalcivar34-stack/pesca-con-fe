"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import { WELCOME_PROMOTION } from "@/lib/promocion-bienvenida";

const PROMOTION_IMAGE_SRC = "/images/promociones/pescador-bienvenida.webp";
const PROMOTION_IMAGE_SIZES = "(max-width: 767px) calc(100vw - 1.5rem), 40vw";

interface WelcomePromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WelcomePromotionDialog({
  open,
  onOpenChange,
}: WelcomePromotionDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-welcome-promotion-overlay
          className="fixed inset-0 z-[90] bg-dark-blue/45 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:duration-75 data-[state=open]:duration-100 motion-reduce:animate-none"
        />
        <DialogPrimitive.Content className="welcome-promotion-dialog fixed left-1/2 top-1/2 z-[91] max-h-[92svh] w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.25rem] bg-[#0b0a08] text-white shadow-[0_18px_55px_rgb(0_0_0_/_0.38)] ring-1 ring-inset ring-gold/75 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:duration-75 data-[state=open]:duration-100 motion-reduce:animate-none sm:rounded-3xl">
          <DialogPrimitive.Close
            className="absolute right-3 top-3 z-30 flex size-10 items-center justify-center rounded-full border border-gold/55 bg-[#0b0a08]/90 text-white shadow-sm transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:right-5 sm:top-5"
            aria-label="Cerrar promoción"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          <div className="grid md:grid-cols-[1.12fr_0.88fr]">
            <div className="relative h-40 overflow-hidden md:order-2 md:h-auto md:min-h-[570px]">
              <Image
                src={PROMOTION_IMAGE_SRC}
                alt="Pescador de Pesca Con Fe con una captura deportiva"
                fill
                loading="eager"
                fetchPriority="high"
                sizes={PROMOTION_IMAGE_SIZES}
                className="object-cover object-[center_38%] md:object-[52%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a08] via-transparent to-black/15 md:bg-gradient-to-r md:from-[#0b0a08] md:via-[#0b0a08]/20 md:to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0b0a08] to-transparent md:inset-y-0 md:-left-px md:right-auto md:h-auto md:w-20 md:bg-gradient-to-r md:via-[#0b0a08]/70" />
              <div className="absolute bottom-3 left-4 rounded-full bg-[#0b0a08]/85 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-gold-light ring-1 ring-inset ring-gold/55 md:bottom-6 md:left-auto md:right-6">
                Fe, pasión y naturaleza
              </div>
            </div>

            <div className="relative bg-[radial-gradient(circle_at_top_left,rgb(236_197_80_/_0.14),transparent_58%)] p-4 sm:p-6 md:p-8">
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
                  <div className="hidden items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-light sm:inline-flex">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Beneficio exclusivo
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-light sm:hidden">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Beneficio exclusivo
                </div>

                <DialogPrimitive.Title className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl md:mt-5 md:text-4xl">
                  ¡Bienvenido a Pesca Con Fe!
                </DialogPrimitive.Title>

                <div className="mt-3 flex items-end gap-3 rounded-2xl bg-[linear-gradient(135deg,rgb(236_197_80_/_0.12),rgb(255_255_255_/_0.025))] px-3 py-3 ring-1 ring-inset ring-gold/20 md:mt-4 md:px-4 md:py-4">
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

                <div className="mt-3 grid gap-2 rounded-2xl bg-white/[0.055] p-3 text-xs text-white/85 ring-1 ring-inset ring-gold/15 sm:grid-cols-3 sm:gap-3 md:mt-5 md:text-sm">
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                    Compra mínima de $50
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                    Descuento máximo $10
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                    Una vez por cliente
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row md:mt-5">
                  <DialogPrimitive.Close asChild>
                    <Link
                      href="/login?mode=register"
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-center text-sm font-black text-black transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:min-h-12 sm:text-base"
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
                    className="font-semibold text-gold-light underline decoration-gold/70 underline-offset-2 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
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
  );
}
