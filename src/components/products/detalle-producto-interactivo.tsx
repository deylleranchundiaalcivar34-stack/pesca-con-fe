"use client";

import { useState } from "react";
import type { CatalogAttribute, Product } from "@/types/producto";
import { ProductDetailActions } from "@/components/products/acciones-detalle-producto";
import { ProductGallery } from "@/components/products/galeria-producto";

interface InteractiveProductDetailProps {
  product: Product;
  variantAttributes: CatalogAttribute[];
}

// Sincroniza la galería y las muestras de color sin convertir la página entera en cliente.
export function InteractiveProductDetail({ product, variantAttributes }: InteractiveProductDetailProps) {
  const isCurrican = product.catalogPath.some((node) => node.slug === "curricanes");
  const isColorVariantLure =
    product.categorySlug === "senuelos" &&
    !isCurrican &&
    product.variants.some((variant) => Boolean(variant.attributes.color));
  const initialColorVariant = isColorVariantLure
    ? product.variants.find((variant) => variant.stock > 0) ?? product.variants[0]
    : undefined;
  const [selectedVariantId, setSelectedVariantId] = useState(initialColorVariant?.id ?? "");
  const [selectedImageId, setSelectedImageId] = useState(
    product.images.find((image) => image.variantId === initialColorVariant?.id)?.id ??
      product.images[0]?.id,
  );

  const selectImage = (imageId: string) => {
    setSelectedImageId(imageId);
    if (!isColorVariantLure) return;

    const variantId = product.images.find((image) => image.id === imageId)?.variantId;
    if (variantId) setSelectedVariantId(variantId);
  };

  const selectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const firstVariantImage = product.images.find((image) => image.variantId === variantId);
    if (firstVariantImage) setSelectedImageId(firstVariantImage.id);
  };

  return (
    <>
      <ProductGallery
        product={product}
        selectedImageId={selectedImageId}
        onSelectedImageIdChange={selectImage}
      />

      <div className="rounded-xl border border-border bg-white p-4 shadow-[0_18px_45px_rgb(13_110_253_/_0.1)] sm:p-5 lg:sticky lg:top-24">
        <h1 className="text-[1.75rem] font-black leading-[1.1] tracking-tight text-dark-blue">
          {product.name}
        </h1>
        <p className="mt-2 text-sm font-semibold text-primary">
          {product.catalogPath.map((item) => item.name).join(" / ")}
        </p>

        <div className="mt-5 border-t border-border pt-4">
          <ProductDetailActions
            product={product}
            variantAttributes={variantAttributes}
            selectedImageId={selectedImageId}
            onSelectedImageIdChange={selectImage}
            selectedVariantId={isColorVariantLure ? selectedVariantId : undefined}
            onSelectedVariantIdChange={isColorVariantLure ? selectVariant : undefined}
          />
        </div>
      </div>
    </>
  );
}
