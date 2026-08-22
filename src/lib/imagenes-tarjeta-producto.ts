import type { ProductImage } from "@/types/producto";

// Conserva solo vistas secundarias validas y evita repetir la imagen principal.
export function getAlternateProductImages(
  images: ProductImage[],
  mainImageUrl: string,
) {
  const seenUrls = new Set([mainImageUrl]);

  return images.filter((image) => {
    const url = image.url.trim();

    if (!url || seenUrls.has(url)) return false;

    seenUrls.add(url);
    return true;
  });
}

// Elige una vista al azar y, cuando hay varias, evita repetir la ultima mostrada.
export function pickRandomProductImage(
  images: ProductImage[],
  previousUrl?: string,
  random: () => number = Math.random,
) {
  const candidates =
    images.length > 1 && previousUrl
      ? images.filter((image) => image.url !== previousUrl)
      : images;

  if (!candidates.length) return null;

  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
}
