"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Error no controlado en la tienda", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-secondary px-4 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black text-dark-blue">Algo no cargó correctamente</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Puede ser un problema temporal. Intenta nuevamente sin perder tu navegación.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => unstable_retry()}>
            <RotateCcw aria-hidden="true" />
            Intentar nuevamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home aria-hidden="true" />
              Ir al inicio
            </Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-muted-foreground">Referencia: {error.digest}</p>
        ) : null}
      </section>
    </main>
  );
}
