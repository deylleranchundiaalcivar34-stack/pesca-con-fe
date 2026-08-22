"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImageLightbox } from "@/components/products/visor-imagen-producto";
import {
  preventProtectedImageAction,
  ProductImageWatermark,
} from "@/components/products/marca-agua-imagen-producto";
import type { Product, ProductImage } from "@/types/producto";
import { canAutoRotateProductGallery } from "@/lib/rotacion-galeria-producto";
import { cn } from "@/lib/utilidades";

interface ProductGalleryProps {
  product: Product;
  selectedImageId?: string;
  onSelectedImageIdChange?: (imageId: string) => void;
}

const fallbackImage = "/images/products/product-placeholder.png";
const autoAdvanceDelayMs = 4_000;
const imageTransitionDurationMs = 450;

// Muestra imagen principal y miniaturas del producto.
export function ProductGallery({ product, selectedImageId, onSelectedImageIdChange }: ProductGalleryProps) {
  const images = useMemo<ProductImage[]>(
    () =>
      product.images.length
        ? product.images
        : [
            {
              id: "placeholder",
              url: fallbackImage,
              alt: product.name,
              isMain: true,
            },
          ],
    [product.images, product.name],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [displayedImageId, setDisplayedImageId] = useState(
    selectedImageId ?? images[0].id,
  );
  const [transitioningImageId, setTransitioningImageId] = useState<string | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const isCurrican = product.catalogPath.some((node) => node.slug === "curricanes");
  const canAutoAdvance = canAutoRotateProductGallery(product);
  const controlledIndex = selectedImageId
    ? images.findIndex((image) => image.id === selectedImageId)
    : -1;
  const activeIndex = controlledIndex >= 0 ? controlledIndex : selectedIndex;
  const selected = images[activeIndex] ?? images[0];
  const displayed = images.find((image) => image.id === displayedImageId) ?? selected;
  const displayedImages =
    displayed.id === selected.id ? [selected] : [displayed, selected];

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current === null) return;

    window.clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = null;
  }, []);

  const selectImage = useCallback(
    (index: number) => {
      setTransitioningImageId(null);
      setSelectedIndex(index);
      onSelectedImageIdChange?.(images[index]?.id ?? images[0].id);
    },
    [images, onSelectedImageIdChange],
  );

  const selectNextImage = useCallback(() => {
    selectImage((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, selectImage]);

  const scheduleAutoAdvance = useCallback(() => {
    clearAutoAdvance();

    if (
      !canAutoAdvance ||
      isLightboxOpen ||
      isFocusedWithin ||
      !isPageVisible ||
      prefersReducedMotion
    ) {
      return;
    }

    autoAdvanceTimerRef.current = window.setTimeout(
      selectNextImage,
      autoAdvanceDelayMs,
    );
  }, [
    canAutoAdvance,
    clearAutoAdvance,
    isFocusedWithin,
    isLightboxOpen,
    isPageVisible,
    prefersReducedMotion,
    selectNextImage,
  ]);

  const selectPreviousImage = () => {
    selectImage((activeIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(motionPreference.matches);
    };

    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);

    return () => {
      motionPreference.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    const updatePageVisibility = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updatePageVisibility);
    };
  }, []);

  useEffect(() => {
    scheduleAutoAdvance();
    return clearAutoAdvance;
  }, [clearAutoAdvance, scheduleAutoAdvance]);

  useEffect(() => {
    if (!transitioningImageId) return;

    const transitionTimer = window.setTimeout(() => {
      setDisplayedImageId(transitioningImageId);
      setTransitioningImageId(null);
    }, imageTransitionDurationMs);

    return () => window.clearTimeout(transitionTimer);
  }, [transitioningImageId]);

  const handleBlurWithin = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocusedWithin(false);
    }
  };

  return (
    <div
      data-auto-advance={canAutoAdvance ? "enabled" : "disabled"}
      onPointerMove={scheduleAutoAdvance}
      onPointerDown={scheduleAutoAdvance}
      onContextMenu={preventProtectedImageAction}
      onDragStart={preventProtectedImageAction}
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={handleBlurWithin}
      className="select-none [-webkit-touch-callout:none] lg:h-[640px] xl:h-[680px]"
    >
      <div className="flex flex-col gap-3 sm:flex-row lg:h-full">
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
                  draggable={false}
                  sizes="96px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div
          className="relative aspect-[4/3] min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-white shadow-[0_18px_45px_rgb(5_44_101_/_0.12)] transition-colors duration-300 hover:border-primary/40 sm:order-2 sm:aspect-[5/4] lg:aspect-auto lg:h-full"
        >
          {displayedImages.map((image) => {
            const isDisplayed = image.id === displayed.id;
            const isTarget = image.id === selected.id;
            const isTransitionTarget =
              isTarget && transitioningImageId === image.id;
            const isVisible = isTarget
              ? isDisplayed || isTransitionTarget
              : isDisplayed && transitioningImageId !== selected.id;

            return (
              <Image
                key={image.id}
                src={image.url}
                alt={isDisplayed ? image.alt : ""}
                fill
                draggable={false}
                loading="eager"
                fetchPriority={isTarget ? "high" : "auto"}
                decoding="sync"
                sizes="(min-width: 1600px) 880px, (min-width: 1024px) 58vw, (min-width: 640px) calc(100vw - 8rem), calc(100vw - 2rem)"
                onLoad={() => {
                  if (isTarget && !isDisplayed) {
                    setTransitioningImageId(image.id);
                  }
                }}
                className={cn(
                  "object-contain transition-opacity duration-[450ms] ease-out motion-reduce:transition-none",
                  isVisible ? "opacity-100" : "opacity-0",
                  isCurrican && "p-2",
                )}
              />
            );
          })}
          <ProductImageWatermark />
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
