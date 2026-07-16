"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PayPhoneBoxPayment } from "@/lib/payphone";

declare global {
  interface Window {
    PPaymentButtonBox?: new (options: Record<string, unknown>) => {
      render: (containerId: string) => void;
    };
  }
}

const PAYPHONE_BOX_CSS = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";
const PAYPHONE_BOX_SCRIPT = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";

function loadPayPhoneBox() {
  return new Promise<void>((resolve, reject) => {
    if (window.PPaymentButtonBox) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PAYPHONE_BOX_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar PayPhone.")), {
        once: true,
      });
      return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = PAYPHONE_BOX_CSS;
    document.head.appendChild(stylesheet);

    const script = document.createElement("script");
    script.src = PAYPHONE_BOX_SCRIPT;
    script.type = "module";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar PayPhone."));
    document.head.appendChild(script);
  });
}

export function PayPhoneBox({
  payment,
  onClose,
}: {
  payment: PayPhoneBoxPayment;
  onClose: () => Promise<void>;
}) {
  const containerId = `payphone-box-${payment.clientTransactionId}`;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isClosing, setIsClosing] = useState(false);

  const closePayment = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await onClose();
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    let active = true;

    loadPayPhoneBox()
      .then(() => {
        if (!active || !window.PPaymentButtonBox) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.replaceChildren();
        new window.PPaymentButtonBox({
          token: payment.token,
          storeId: payment.storeId,
          amount: payment.amount,
          amountWithoutTax: payment.amountWithoutTax,
          amountWithTax: 0,
          tax: 0,
          service: 0,
          tip: 0,
          currency: "USD",
          clientTransactionId: payment.clientTransactionId,
          reference: payment.reference,
          lang: "es",
          backgroundColor: "#063f86",
        }).render(containerId);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));

    return () => {
      active = false;
    };
  }, [containerId, payment]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-dark-blue/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="payphone-box-title">
      <section className="max-h-[calc(100dvh-0.75rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-primary/10 bg-white px-5 py-5 sm:px-7">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" /> Pago seguro</p>
            <h2 id="payphone-box-title" className="mt-1 text-xl font-bold text-dark-blue">Paga con tarjeta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Completa tu pago sin salir de Pesca Con Fe.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={closePayment} disabled={isClosing} aria-label="Cancelar pago">
            {isClosing ? <LoaderCircle className="animate-spin" /> : <X />}
          </Button>
        </div>
        <div className="px-5 py-6 sm:px-7">
          {status === "loading" ? <div className="flex min-h-36 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin text-primary" /> Cargando pago seguro…</div> : null}
          {status === "error" ? <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><p className="flex gap-2 font-semibold"><AlertTriangle className="size-4" /> No pudimos cargar la Cajita de PayPhone.</p><p className="mt-1">Verifica que PayPhone tenga autorizado exactamente https://pescaconfe.com e inténtalo otra vez.</p></div> : null}
          <div id={containerId} className={status === "ready" ? "min-h-20" : "hidden"} />
          <p className="mt-5 flex gap-2 text-xs leading-5 text-muted-foreground"><CreditCard className="mt-0.5 size-4 shrink-0 text-primary" /> PayPhone procesa la tarjeta. Pesca Con Fe no ve ni almacena sus datos.</p>
        </div>
      </section>
    </div>
  );
}
