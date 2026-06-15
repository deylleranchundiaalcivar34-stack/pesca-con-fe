import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constantes";
import { getProducts } from "@/lib/supabase/data";

// Genera sitemap dinamico con rutas estaticas y productos activos.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/productos",
    "/carrito",
    "/checkout",
    "/quienes-somos",
    "/contacto",
    "/login",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.75,
  }));

  const products = await getProducts();
  const productRoutes = products
    .filter((product) => product.isActive)
    .map((product) => ({
      url: `${SITE_URL}/productos/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: product.isFeatured ? 0.9 : 0.7,
    }));

  return [...staticRoutes, ...productRoutes];
}
