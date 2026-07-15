"use client";

import { useEffect, useState, type PointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ProductImage } from "@/types/producto";
import { cn } from "@/lib/utilidades";

interface ProductImageLightboxProps {
  images: ProductImage[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  onClose: () => void;
}

interface ZoomPosition {
  cursorX: number;
  cursorY: number;
  lensLeft: number;
  lensTop: number;
  size: number;
  containerWidth: number;
  containerHeight: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface DisplayedImageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const lensSize = 190;
const zoomFactor = 1.65;

// Visor ampliado: el zoom se activa solo dentro del modal para no afectar la vista normal.
export function ProductImageLightbox({
  images,
  selectedIndex,
  onSelectedIndexChange,
  onClose,
}: ProductImageLightboxProps) {
  const [zoomPosition, setZoomPosition] = useState<ZoomPosition | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const selected = images[selectedIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;

  const selectImage = (index: number) => {
    setZoomPosition(null);
    setImageDimensions(null);
    onSelectedIndexChange(index);
  };

  const selectPreviousImage = () => {
    selectImage((selectedIndex - 1 + images.length) % images.length);
  };

  const selectNextImage = () => {
    selectImage((selectedIndex + 1) % images.length);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (hasMultipleImages && event.key === "ArrowLeft") selectPreviousImage();
      if (hasMultipleImages && event.key === "ArrowRight") selectNextImage();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  const getDisplayedImageRect = (
    containerWidth: number,
    containerHeight: number,
  ): DisplayedImageRect | null => {
    if (!imageDimensions || !containerWidth || !containerHeight) return null;

    const imageRatio = imageDimensions.width / imageDimensions.height;
    const containerRatio = containerWidth / containerHeight;
    const width = imageRatio > containerRatio ? containerWidth : containerHeight * imageRatio;
    const height = imageRatio > containerRatio ? containerWidth / imageRatio : containerHeight;

    return {
      left: (containerWidth - width) / 2,
      top: (containerHeight - height) / 2,
      width,
      height,
    };
  };

  const updateZoomPosition = (event: PointerEvent<HTMLImageElement>) => {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      setZoomPosition(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const imageRect = getDisplayedImageRect(bounds.width, bounds.height);

    if (!imageRect) return;

    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;

    if (
      cursorX < imageRect.left ||
      cursorX > imageRect.left + imageRect.width ||
      cursorY < imageRect.top ||
      cursorY > imageRect.top + imageRect.height
    ) {
      setZoomPosition(null);
      return;
    }

    const size = Math.min(lensSize, imageRect.width, imageRect.height);

    setZoomPosition({
      cursorX,
      cursorY,
      lensLeft: Math.min(
        Math.max(cursorX - size / 2, imageRect.left),
        imageRect.left + imageRect.width - size,
      ),
      lensTop: Math.min(
        Math.max(cursorY - size / 2, imageRect.top),
        imageRect.top + imageRect.height - size,
      ),
      size,
      containerWidth: bounds.width,
      containerHeight: bounds.height,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-blue/85 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Visor ampliado de imagen del producto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-full w-full max-w-6xl flex-col rounded-2xl bg-white p-3 shadow-2xl sm:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-30 grid size-11 place-items-center rounded-full border border-border bg-white text-dark-blue shadow-md transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Cerrar visor de imagen"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-5">
          {hasMultipleImages ? (
            <div className="order-2 flex shrink-0 gap-2 overflow-x-auto p-1 sm:order-1 sm:w-24 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pr-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => selectImage(index)}
                  className={cn(
                    "relative aspect-square w-14 shrink-0 overflow-hidden rounded-md border-2 bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-20",
                    selected.id === image.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/60",
                  )}
                  aria-label={`Ver imagen: ${image.alt}`}
                >
                  <Image src={image.url} alt={image.alt} fill sizes="80px" className="object-contain p-1" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-secondary/40">
            <Image
              src={selected.url}
              alt={selected.alt}
              fill
              priority
              sizes="(min-width: 1024px) 1100px, 100vw"
              onLoad={(event) => {
                setImageDimensions({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
              onPointerEnter={updateZoomPosition}
              onPointerMove={updateZoomPosition}
              onPointerLeave={() => setZoomPosition(null)}
              className="object-contain [@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-in"
            />

            {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={selectPreviousImage}
                className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-primary/20 bg-white/90 text-dark-blue shadow-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-5"
                aria-label="Ver imagen anterior"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={selectNextImage}
                className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-primary/20 bg-white/90 text-dark-blue shadow-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-5"
                aria-label="Ver imagen siguiente"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
            ) : null}

            {zoomPosition ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-10 overflow-hidden rounded-lg border-2 border-white bg-white shadow-[0_10px_30px_rgb(5_44_101_/_0.32)] ring-1 ring-primary/35"
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
                  className="object-contain"
                />
              </div>
            </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
