import { businessConfig } from "@/data/mock-business";
import { SITE_URL } from "@/lib/constants";

export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: businessConfig.name,
    description:
      "Tienda de artículos de pesca en Shushufindi, Ecuador. Equipos, cañas, carretes, señuelos e indumentaria.",
    url: SITE_URL,
    telephone: businessConfig.phones,
    email: businessConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: businessConfig.location,
      addressLocality: businessConfig.city,
      addressCountry: businessConfig.country,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:30",
        closes: "18:00",
      },
    ],
    sameAs: [
      businessConfig.social.facebook,
      businessConfig.social.instagram,
      businessConfig.social.tiktok,
      businessConfig.social.youtube,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
