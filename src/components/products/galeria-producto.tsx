"use client";

import { useState, type PointerEvent } from "react";
import Image from "next/image";
import type { Product, ProductImage } from "@/types/producto";
import { cn } from "@/lib/utilidades";

interface ProductGalleryProps {
  product: Product;
}

const fallbackImage = "/images/products/product-placeholder.png";
const lensSize = 180;
const zoomFactor = 2.5;

interface ZoomPosition {
  cursorX: number;
  cursorY: number;
  lensLeft: number;
  lensTop: number;
  size: number;
  containerWidth: number;
  containerHeight: number;
}

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
  const [zoomPosition, setZoomPosition] = useState<ZoomPosition | null>(null);
  const selected = images[selectedIndex] ?? images[0];

  const updateZoomPosition = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      setZoomPosition(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const cursorX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const cursorY = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
    const size = Math.min(lensSize, bounds.width, bounds.height);

    setZoomPosition({
      cursorX,
      cursorY,
      lensLeft: Math.min(Math.max(cursorX - size / 2, 0), bounds.width - size),
      lensTop: Math.min(Math.max(cursorY - size / 2, 0), bounds.height - size),
      size,
      containerWidth: bounds.width,
      containerHeight: bounds.height,
    });
  };

  const selectImage = (index: number) => {
    setZoomPosition(null);
    setSelectedIndex(index);
  };

  return (
    <div className="space-y-4">
      <div
        onPointerEnter={updateZoomPosition}
        onPointerMove={updateZoomPosition}
        onPointerLeave={() => setZoomPosition(null)}
        className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-white shadow-[0_18px_45px_rgb(5_44_101_/_0.12)] transition hover:border-primary/40 [@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-in"
      >
        <Image
          src={selected.url}
          alt={selected.alt}
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="object-contain p-4 sm:p-6"
        />

        {zoomPosition ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 overflow-hidden rounded-md border-2 border-white bg-white shadow-[0_10px_30px_rgb(5_44_101_/_0.32)] ring-1 ring-primary/35"
            style={{
              left: zoomPosition.lensLeft,
              top: zoomPosition.lensTop,
              width: zoomPosition.size,
              height: zoomPosition.size,
            }}
          >
            <div
              className="relative max-w-none"
              style={{
                width: zoomPosition.containerWidth,
                height: zoomPosition.containerHeight,
                transformOrigin: "top left",
                transform: `matrix(${zoomFactor}, 0, 0, ${zoomFactor}, ${
                  zoomPosition.size / 2 - zoomPosition.cursorX * zoomFactor
                }, ${zoomPosition.size / 2 - zoomPosition.cursorY * zoomFactor})`,
              }}
            >
              <Image
                src={selected.url}
                alt=""
                fill
                sizes="100vw"
                className="object-contain p-4 sm:p-6"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => selectImage(index)}
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

    </div>
  );
}
