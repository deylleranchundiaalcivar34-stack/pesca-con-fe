"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ProductImage } from "@/types/producto";
import { cn } from "@/lib/utilidades";

interface ProductImageViewerProps {
  images: ProductImage[];
  selectedIndex: number;
  open: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

// Lightbox accesible para recorrer las imagenes sin abandonar el detalle del producto.
export function ProductImageViewer({
  images,
  selectedIndex,
  open,
  onClose,
  onSelect,
}: ProductImageViewerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selected = images[selectedIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultipleImages) {
        onSelect((selectedIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && hasMultipleImages) {
        onSelect((selectedIndex + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, images.length, onClose, onSelect, open, selectedIndex]);

  if (!open || !selected) return null;

  const showPrevious = () =>
    onSelect((selectedIndex - 1 + images.length) % images.length);
  const showNext = () => onSelect((selectedIndex + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white/98"
      role="dialog"
      aria-modal="true"
      aria-label="Galería ampliada del producto"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-dark-blue">
          Imagen {selectedIndex + 1} de {images.length}
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-white text-dark-blue shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar galería ampliada"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="relative mx-auto h-full max-w-6xl">
          <Image
            src={selected.url}
            alt={selected.alt}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        </div>

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 text-dark-blue shadow-lg transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-6 sm:size-12"
              aria-label="Ver imagen anterior"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/95 text-dark-blue shadow-lg transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-6 sm:size-12"
              aria-label="Ver imagen siguiente"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="shrink-0 border-t border-border bg-secondary/35 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-4xl gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-20",
                  index === selectedIndex
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-border hover:border-primary/60",
                )}
                aria-label={`Ver imagen ampliada: ${image.alt}`}
                aria-current={index === selectedIndex ? "true" : undefined}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
