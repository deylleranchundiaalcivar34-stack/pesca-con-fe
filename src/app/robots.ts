import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constantes";

// Define reglas basicas para rastreadores y enlaza el sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
