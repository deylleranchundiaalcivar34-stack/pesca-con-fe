import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";

export default function ProductDetailLoading() {
  return (
    <PublicShell>
      <section className="border-b border-border bg-white py-3">
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

      <section className="bg-white pb-10 pt-5 sm:pb-12 sm:pt-6">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,0.97fr)] lg:items-start lg:gap-10 lg:px-8">
          <div className="lg:h-[540px] xl:h-[560px]">
            <div className="flex flex-col gap-3 sm:flex-row lg:h-full">
              <div className="order-2 flex shrink-0 gap-3 overflow-x-auto p-1 sm:order-1 sm:w-20 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pr-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square w-20 shrink-0 animate-pulse rounded-md border-2 border-border bg-secondary sm:w-16"
                  />
                ))}
              </div>
              <div className="aspect-square min-w-0 flex-1 animate-pulse rounded-lg border border-border bg-secondary shadow-[0_18px_45px_rgb(5_44_101_/_0.12)] sm:order-2 lg:aspect-auto lg:h-full" />
            </div>
          </div>

          <div className="flex min-h-[540px] flex-col rounded-xl border border-border bg-white p-4 shadow-[0_18px_45px_rgb(13_110_253_/_0.1)] sm:p-5 xl:min-h-[560px]">
            <div className="h-5 w-20 animate-pulse rounded-md bg-secondary" />
            <div className="mt-4 h-10 w-4/5 animate-pulse rounded-md bg-secondary" />
            <div className="mt-2 h-5 w-40 animate-pulse rounded-md bg-secondary" />
            <div className="mt-4 space-y-2">
              <div className="h-4 animate-pulse rounded-md bg-secondary" />
              <div className="h-4 w-5/6 animate-pulse rounded-md bg-secondary" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-secondary" />
            </div>
            <div className="mt-auto border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="h-5 w-20 animate-pulse rounded-md bg-secondary" />
                  <div className="mt-1 h-9 w-28 animate-pulse rounded-md bg-secondary" />
                </div>
                <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
              </div>
              <div className="mt-3 h-20 animate-pulse rounded-lg bg-secondary" />
              <div className="mt-3 h-10 w-36 animate-pulse rounded-md bg-secondary" />
              <div className="mt-3 h-11 animate-pulse rounded-md bg-secondary" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div className="h-8 animate-pulse rounded-md bg-secondary" />
              <div className="h-8 animate-pulse rounded-md bg-secondary" />
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
