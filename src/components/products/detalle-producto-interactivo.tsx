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
  const [selectedImageId, setSelectedImageId] = useState(product.images[0]?.id);

  return (
    <>
      <ProductGallery
        product={product}
        selectedImageId={selectedImageId}
        onSelectedImageIdChange={setSelectedImageId}
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
            onSelectedImageIdChange={setSelectedImageId}
          />
        </div>
      </div>
    </>
  );
}
