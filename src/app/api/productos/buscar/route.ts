import { NextResponse, type NextRequest } from "next/server";
import {
  getRelatedSearchSuggestions,
  normalizeSearchText,
  rankProductsForSearch,
} from "@/lib/busqueda-productos";
import { getProducts } from "@/lib/supabase/data";
import { getProductPricingSummary } from "@/lib/precios-producto";
import { consumeRateLimit, getRequestAddress } from "@/lib/rate-limit";

// Devuelve sugerencias breves para el buscador del encabezado.
export async function GET(request: NextRequest) {
  const allowed = await consumeRateLimit({
    bucket: "public.search",
    identifier: getRequestAddress(request.headers),
    max: 120,
    windowSeconds: 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { results: [], total: 0, suggestions: [] },
      { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }

  const query = normalizeSearchText(
    (request.nextUrl.searchParams.get("q") ?? "").slice(0, 60),
  );

  if (query.length < 2) {
    return NextResponse.json({ results: [], total: 0, suggestions: [] });
  }

  const products = (await getProducts()).filter((product) => product.isActive);
  const matchingProducts = rankProductsForSearch(query, products).map(
    ({ product }) => product,
  );
  const results = matchingProducts
    .slice(0, 6)
    .map((product) => ({
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      image: product.mainImage,
      imageAlt: product.imageAlt,
      price: getProductPricingSummary(product).minimumEffectivePrice,
    }));

  return NextResponse.json(
    {
      results,
      total: matchingProducts.length,
      suggestions: matchingProducts.length
        ? []
        : getRelatedSearchSuggestions(query, products),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
