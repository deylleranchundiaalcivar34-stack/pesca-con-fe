import type { Product } from "@/types/producto";
import { SITE_URL } from "@/lib/constantes";
import { getProductPricingSummary } from "@/lib/precios-producto";
import { serializeJsonLd } from "@/lib/seguridad-json-ld";

interface ProductJsonLdProps {
  product: Product;
}

// Inserta datos estructurados de producto para SEO.
export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const pricing = getProductPricingSummary(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: product.brand,
    sku: product.sku,
    image: product.images.map((image) => `${SITE_URL}${image.url}`),
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: pricing.minimumEffectivePrice,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/producto/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
