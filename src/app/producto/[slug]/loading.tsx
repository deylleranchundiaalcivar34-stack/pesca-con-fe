import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";

export default function ProductDetailLoading() {
  return (
    <PublicShell>
      <section className="bg-[linear-gradient(180deg,#f1f7ff_0%,#ffffff_100%)] py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Link href="/productos" className="shrink-0 hover:text-primary">
              Productos
            </Link>
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            <span>Cargando producto...</span>
          </div>
        </div>
      </section>

      <section className="bg-white pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,0.97fr)] lg:items-start lg:gap-12 lg:px-8">
          <div className="space-y-4">
            <div className="aspect-square animate-pulse rounded-lg border border-border bg-secondary shadow-[0_18px_45px_rgb(5_44_101_/_0.12)]" />
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-md border border-border bg-secondary"
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-[0_18px_45px_rgb(13_110_253_/_0.1)] sm:p-6">
            <div className="flex gap-2">
              <div className="h-6 w-24 animate-pulse rounded-md bg-secondary" />
              <div className="h-6 w-32 animate-pulse rounded-md bg-secondary" />
            </div>
            <div className="mt-4 h-12 w-4/5 animate-pulse rounded-md bg-secondary" />
            <div className="mt-3 h-5 w-56 animate-pulse rounded-md bg-secondary" />
            <div className="mt-5 h-10 w-40 animate-pulse rounded-md bg-secondary" />
            <div className="mt-5 space-y-3">
              <div className="h-4 animate-pulse rounded-md bg-secondary" />
              <div className="h-4 w-5/6 animate-pulse rounded-md bg-secondary" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-secondary" />
            </div>
            <div className="mt-7 h-12 animate-pulse rounded-md bg-secondary" />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
