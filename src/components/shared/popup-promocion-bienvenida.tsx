"use client";

import { getImageProps } from "next/image";
import { usePathname } from "next/navigation";
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { preload } from "react-dom";
import { BadgePercent } from "lucide-react";
import { shouldShowFloatingWhatsAppHelp } from "@/lib/ayuda-whatsapp";
import { isWelcomePromotionActive } from "@/lib/promocion-bienvenida";
import {
  getPublicSessionServerSnapshot,
  getPublicSessionSnapshot,
  refreshPublicSession,
  subscribePublicSession,
} from "@/lib/sesion-publica";

const DISMISSAL_KEY = "pesca-con-fe:promocion-bienvenida-cerrada:v3";
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PROMOTION_IMAGE_SRC = "/images/promociones/pescador-bienvenida.webp";
const PROMOTION_IMAGE_SIZES = "(max-width: 767px) calc(100vw - 1.5rem), 40vw";
const promotionImageProps = getImageProps({
  src: PROMOTION_IMAGE_SRC,
  alt: "",
  fill: true,
  sizes: PROMOTION_IMAGE_SIZES,
}).props;

type PromotionDialogModule = typeof import("./dialogo-promocion-bienvenida");

let promotionDialogPromise: Promise<PromotionDialogModule> | undefined;

function loadPromotionDialog() {
  promotionDialogPromise ??= import("./dialogo-promocion-bienvenida");
  return promotionDialogPromise;
}

const PromotionDialog = lazy(loadPromotionDialog);

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

function preloadPromotionImage() {
  preload(promotionImageProps.src, {
    as: "image",
    fetchPriority: "high",
    imageSizes: promotionImageProps.sizes,
    imageSrcSet: promotionImageProps.srcSet,
  });
}

export function WelcomePromotionPopup() {
  const pathname = usePathname();
  const session = useSyncExternalStore(
    subscribePublicSession,
    getPublicSessionSnapshot,
    getPublicSessionServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const [dialogReady, setDialogReady] = useState(false);

  useEffect(() => {
    void refreshPublicSession();
  }, []);

  const isAllowedRoute = shouldShowFloatingWhatsAppHelp(pathname);
  const canOffer =
    session.status === "ready" &&
    !session.user &&
    isAllowedRoute &&
    isWelcomePromotionActive();
  const canAutoOpen = canOffer && !wasRecentlyDismissed();

  useEffect(() => {
    if (!canAutoOpen) return;

    let cancelled = false;
    preloadPromotionImage();

    const timer = window.setTimeout(() => {
      void loadPromotionDialog().then(() => {
        if (cancelled) return;
        setDialogReady(true);
        setOpen(true);
      });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canAutoOpen]);

  const preparePromotion = () => {
    preloadPromotionImage();
    void loadPromotionDialog().then(() => setDialogReady(true));
  };

  const showPromotion = () => {
    preloadPromotionImage();
    void loadPromotionDialog().then(() => {
      setDialogReady(true);
      setOpen(true);
    });
  };

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) rememberDismissal();
  };

  return (
    <>
      {dialogReady ? (
        <Suspense fallback={null}>
          <PromotionDialog open={open && canOffer} onOpenChange={changeOpen} />
        </Suspense>
      ) : null}

      {canOffer && !open ? (
        <button
          type="button"
          onClick={showPromotion}
          onFocus={preparePromotion}
          onPointerEnter={preparePromotion}
          className="welcome-promotion-attention-button group fixed bottom-[5.25rem] left-4 z-[39] flex size-12 items-center justify-center rounded-full bg-gold text-black shadow-[0_3px_10px_rgb(0_0_0_/_0.18)] transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-blue sm:left-6"
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
