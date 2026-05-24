import type { Product } from "@/types/product";
import { SITE_URL } from "@/lib/constants";

interface ProductJsonLdProps {
  product: Product;
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
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
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/productos/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
