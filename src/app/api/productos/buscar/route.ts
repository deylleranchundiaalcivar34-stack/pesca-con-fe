import { NextResponse, type NextRequest } from "next/server";
import {
  getSearchTerms,
  matchesProductSearch,
  normalizeSearchText,
} from "@/lib/busqueda-productos";
import { searchProductsByTerms } from "@/lib/supabase/data";
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
      { results: [] },
      { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }

  const query = normalizeSearchText(
    (request.nextUrl.searchParams.get("q") ?? "").slice(0, 60),
  );

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await searchProductsByTerms(getSearchTerms(query));
  const matchingProducts = products
    .filter((product) => product.isActive)
    .filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.subcategory,
        product.description,
        ...product.features,
        ...product.catalogPath.map((item) => item.name),
      ].join(" ");

      return matchesProductSearch(query, searchableText);
    });
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
    { results, total: matchingProducts.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
