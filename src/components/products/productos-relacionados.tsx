"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/producto";
import { ProductCard } from "@/components/products/tarjeta-producto";

// Carrusel ligero: conserva las tarjetas existentes y avanza una tarjeta por accion.
export function RelatedProducts({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [products.length]);

  if (!products.length) return null;

  const moveByOneProduct = (direction: -1 | 1) => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const start = track.scrollLeft;
    const maximumScroll = track.scrollWidth - track.clientWidth;
    const target = Math.max(
      0,
      Math.min(
        start + direction * (firstCard.getBoundingClientRect().width + gap),
        maximumScroll,
      ),
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.scrollLeft = target;
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const duration = 520;
    const startedAt = performance.now();
    const distance = target - start;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startedAt) / duration, 1);
      const easedProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      track.scrollLeft = start + distance * easedProgress;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="relative" role="region" aria-label="Productos relacionados">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[82vw] max-w-[310px] shrink-0 snap-start transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none [&>*]:h-full sm:w-[calc((100%_-_1rem)/2)] sm:max-w-none lg:w-[calc((100%_-_2rem)/3)] xl:w-[calc((100%_-_3rem)/4)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => moveByOneProduct(-1)}
        disabled={!canScrollLeft}
        className="absolute -left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-dark-blue shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:scale-90 disabled:opacity-0 motion-reduce:transition-none sm:-left-5"
        aria-label="Ver producto relacionado anterior"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => moveByOneProduct(1)}
        disabled={!canScrollRight}
        className="absolute -right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-dark-blue shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:scale-90 disabled:opacity-0 motion-reduce:transition-none sm:-right-5"
        aria-label="Ver producto relacionado siguiente"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
