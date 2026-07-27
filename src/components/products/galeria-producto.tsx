"use client";

import { useState, type SyntheticEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImageLightbox } from "@/components/products/visor-imagen-producto";
import type { Product, ProductImage } from "@/types/producto";
import { cn } from "@/lib/utilidades";

interface ProductGalleryProps {
  product: Product;
  selectedImageId?: string;
  onSelectedImageIdChange?: (imageId: string) => void;
}

const fallbackImage = "/images/products/product-placeholder.png";
// Muestra imagen principal y miniaturas del producto.
export function ProductGallery({ product, selectedImageId, onSelectedImageIdChange }: ProductGalleryProps) {
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const isCurrican = product.catalogPath.some((node) => node.slug === "curricanes");
  const controlledIndex = selectedImageId
    ? images.findIndex((image) => image.id === selectedImageId)
    : -1;
  const activeIndex = controlledIndex >= 0 ? controlledIndex : selectedIndex;
  const selected = images[activeIndex] ?? images[0];
  const selectedImageRatio = imageRatios[selected.id];

  const preserveImageRatio = (event: SyntheticEvent<HTMLImageElement>) => {
    if (isCurrican) return;

    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    const ratio = naturalWidth / naturalHeight;
    setImageRatios((currentRatios) =>
      currentRatios[selected.id] === ratio
        ? currentRatios
        : { ...currentRatios, [selected.id]: ratio },
    );
  };

  const selectImage = (index: number) => {
    setSelectedIndex(index);
    onSelectedImageIdChange?.(images[index]?.id ?? images[0].id);
  };

  const selectPreviousImage = () => {
    selectImage((activeIndex - 1 + images.length) % images.length);
  };

  const selectNextImage = () => {
    selectImage((activeIndex + 1) % images.length);
  };

  return (
    <div className={cn(isCurrican && "lg:h-[640px] xl:h-[680px]")}>
      <div className={cn("flex flex-col gap-3 sm:flex-row", isCurrican && "lg:h-full")}>
        {images.length > 1 ? (
          <div className="order-2 flex shrink-0 gap-3 overflow-x-auto p-1 sm:order-1 sm:w-20 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pr-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => selectImage(index)}
                className={cn(
                  "relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border-2 bg-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-16",
                  selected.id === image.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/60",
                )}
                aria-label={`Ver imagen: ${image.alt}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="96px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "relative aspect-square min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-white shadow-[0_18px_45px_rgb(5_44_101_/_0.12)] transition-[border-color,aspect-ratio] duration-300 hover:border-primary/40 sm:order-2",
            isCurrican && "lg:aspect-auto lg:h-full",
          )}
          style={
            !isCurrican && selectedImageRatio
              ? { aspectRatio: selectedImageRatio }
              : undefined
          }
        >
          <Image
            key={selected.id}
            src={selected.url}
            alt={selected.alt}
            fill
            preload
            sizes="(min-width: 1024px) 48vw, 100vw"
            onLoad={preserveImageRatio}
            className={cn("object-contain", isCurrican && "p-2")}
          />
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            aria-label={`Ampliar imagen: ${selected.alt}`}
          />

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={selectPreviousImage}
                className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-primary/20 bg-white/90 text-dark-blue shadow-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-4"
                aria-label="Ver imagen anterior"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={selectNextImage}
                className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-primary/20 bg-white/90 text-dark-blue shadow-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4"
                aria-label="Ver imagen siguiente"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {isLightboxOpen ? (
        <ProductImageLightbox
          images={images}
          selectedIndex={activeIndex}
          onSelectedIndexChange={selectImage}
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}
