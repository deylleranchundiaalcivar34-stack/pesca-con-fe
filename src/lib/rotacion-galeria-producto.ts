import type { Product } from "@/types/producto";

type ProductGalleryRotationSource = Pick<Product, "images" | "variants">;

// La rotación automática solo es segura cuando ninguna opción de compra
// puede cambiar y existen al menos dos imágenes reales para recorrer.
export function canAutoRotateProductGallery(
  product: ProductGalleryRotationSource,
) {
  return (
    product.images.length >= 2 &&
    !product.variants.some((variant) => variant.isActive)
  );
}
