"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Product } from "@/types/producto";
import { ProductCard } from "@/components/products/tarjeta-producto";

interface RelatedProductsProps {
  products: Product[];
  viewMoreHref: string;
  viewMoreLabel: string;
}

// Carrusel finito: muestra hasta ocho relacionados y avanza una vista completa por accion.
export function RelatedProducts({
  products,
  viewMoreHref,
  viewMoreLabel,
}: RelatedProductsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const visibleProducts = products.slice(0, 8);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateControls = () => {
      const maximumScroll = track.scrollWidth - track.clientWidth;
      setCanScrollLeft(track.scrollLeft > 2);
      setCanScrollRight(track.scrollLeft < maximumScroll - 2);
    };

    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener("scroll", updateControls);
      resizeObserver.disconnect();
    };
  }, [visibleProducts.length]);

  if (!visibleProducts.length) return null;

  const moveByOnePage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const maximumScroll = track.scrollWidth - track.clientWidth;
    const target = Math.max(
      0,
      Math.min(track.scrollLeft + direction * track.clientWidth, maximumScroll),
    );

    // El desplazamiento es deliberadamente inmediato para que la flecha responda al clic.
    track.scrollLeft = target;
  };

  return (
    <div className="relative" role="region" aria-label="Productos relacionados">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleProducts.map((product) => (
          <div
            key={product.id}
            className="w-[82vw] max-w-[310px] shrink-0 snap-start [&>*]:h-full sm:w-[calc((100%_-_1rem)/2)] sm:max-w-none lg:w-[calc((100%_-_2rem)/3)] xl:w-[calc((100%_-_3rem)/4)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
        <div className="w-[82vw] max-w-[310px] shrink-0 snap-start sm:w-[calc((100%_-_1rem)/2)] sm:max-w-none lg:w-[calc((100%_-_2rem)/3)] xl:w-[calc((100%_-_3rem)/4)]">
          <Link
            href={viewMoreHref}
            className="group flex h-full min-h-[28rem] flex-col items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-white to-secondary p-7 text-center shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            aria-label={`Ver más productos de ${viewMoreLabel}`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none">
              <Search className="size-7" aria-hidden="true" />
            </span>
            <span className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-primary">
              Sigue explorando
            </span>
            <span className="mt-2 text-2xl font-black leading-tight text-dark-blue">
              Ver más de {viewMoreLabel}
            </span>
            <span className="mt-3 text-sm leading-6 text-muted-foreground">
              Encuentra todos los productos disponibles en esta clasificación.
            </span>
            <span className="mt-7 inline-flex items-center gap-2 font-bold text-primary">
              Ir al catálogo
              <ArrowUpRight
                className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => moveByOnePage(-1)}
        disabled={!canScrollLeft}
        className="absolute -left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-dark-blue shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:scale-90 disabled:opacity-0 motion-reduce:transition-none sm:-left-5"
        aria-label="Ver producto relacionado anterior"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => moveByOnePage(1)}
        disabled={!canScrollRight}
        className="absolute -right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-dark-blue shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:scale-90 disabled:opacity-0 motion-reduce:transition-none sm:-right-5"
        aria-label="Ver producto relacionado siguiente"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
