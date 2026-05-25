"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [selected, setSelected] = useState(product.images[0] ?? {
    id: "placeholder",
    url: "/images/products/product-placeholder.png",
    alt: product.name,
  });

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary shadow-sm">
        <Image
          src={selected.url}
          alt={selected.alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {product.images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelected(image)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-md border bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected.id === image.id ? "border-primary" : "border-border",
            )}
            aria-label={`Ver imagen: ${image.alt}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="120px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
