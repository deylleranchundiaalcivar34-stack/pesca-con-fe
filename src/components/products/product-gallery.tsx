"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product, ProductImage } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  product: Product;
}

const fallbackImage = "/images/products/product-placeholder.png";

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
  const selected = images[selectedIndex] ?? images[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white shadow-[0_18px_45px_rgb(5_44_101_/_0.12)]">
        <Image
          src={selected.url}
          alt={selected.alt}
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="object-contain p-4 sm:p-6"
        />
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-md border bg-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
    </div>
  );
}
