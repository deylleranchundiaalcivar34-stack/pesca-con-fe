"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { Product, ProductImage } from "@/types/producto";
import { ProductImageViewer } from "@/components/products/visor-imagen-producto";
import { cn } from "@/lib/utilidades";

interface ProductGalleryProps {
  product: Product;
}

const fallbackImage = "/images/products/product-placeholder.png";

// Muestra imagen principal y miniaturas del producto.
export function ProductGallery({ product }: ProductGalleryProps) {
  const images: ProductImage[] = product.images.length
    ? product.images
    : [
        {
          id: "placeholder",
          url: fallbackImage,
          alt: product.name,
          isMain: true,
        },
      ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const selected = images[selectedIndex] ?? images[0];
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-white text-left shadow-[0_18px_45px_rgb(5_44_101_/_0.12)] transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ampliar imagen: ${selected.alt}`}
      >
        <Image
          src={selected.url}
          alt={selected.alt}
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="object-contain p-4 sm:p-6"
        />
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/95 px-3 py-2 text-sm font-bold text-dark-blue shadow-md transition group-hover:text-primary">
          <Maximize2 className="size-4" aria-hidden="true" />
          Ampliar
        </span>
      </button>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border bg-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-24",
              selected.id === image.id
                ? "border-primary ring-2 ring-primary/25"
                : "border-border hover:border-primary/60",
            )}
            aria-label={`Ver imagen: ${image.alt}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="120px"
              className="object-contain p-2"
            />
          </button>
        ))}
      </div>

      <ProductImageViewer
        images={images}
        selectedIndex={selectedIndex}
        open={viewerOpen}
        onClose={closeViewer}
        onSelect={setSelectedIndex}
      />
    </div>
  );
}
