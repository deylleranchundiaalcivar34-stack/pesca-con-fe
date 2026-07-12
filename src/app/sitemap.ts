import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constantes";
import { getCatalogPaths, getProducts } from "@/lib/supabase/data";

// Genera sitemap dinamico con rutas estaticas y productos activos.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/productos",
    "/carrito",
    "/checkout",
    "/quienes-somos",
    "/preguntas-frecuentes",
    "/contacto",
    "/login",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.75,
  }));

  const [products, catalogPaths] = await Promise.all([getProducts(), getCatalogPaths()]);
  const productRoutes = products
    .filter((product) => product.isActive)
    .map((product) => ({
      url: `${SITE_URL}/producto/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: product.isFeatured ? 0.9 : 0.7,
    }));

  const catalogRoutes = catalogPaths.map((path) => ({
    url: `${SITE_URL}/productos/${path.map((item) => item.slug).join("/")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path.length === 1 ? 0.85 : 0.75,
  }));

  return [...staticRoutes, ...catalogRoutes, ...productRoutes];
}
