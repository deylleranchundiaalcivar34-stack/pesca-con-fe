import { NextResponse, type NextRequest } from "next/server";
import { getProducts } from "@/lib/supabase/data";
import { getProductPricingSummary } from "@/lib/precios-producto";

const relatedTerms = [
  ["cana", "canas", "vara", "varas"],
  ["carrete", "carretes", "reel", "reels", "molinete", "molinetes"],
  ["senuelo", "senuelos", "carnada", "carnadas", "jig", "jigging", "minnow"],
  ["linea", "lineas", "hilo", "hilos", "braid", "trenzado", "monofilamento", "leader", "leaders"],
  ["anzuelo", "anzuelos", "hook", "hooks"],
  ["combo", "combos", "kit", "kits", "set"],
  ["indumentaria", "ropa", "jersey", "gorra", "gorras", "pantalon", "pantalones", "buff", "mascara", "mascaras"],
  ["camping", "carpa", "carpas", "equipamiento", "mochila", "mochilas", "tula", "tulas", "bolso", "bolsos"],
  ["herramienta", "herramientas", "alicate", "alicates", "pinza", "pinzas", "tijera", "tijeras", "bascula", "basculas"],
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getRelatedTerms(term: string) {
  return relatedTerms.find((group) => group.some((word) => word === term || word.startsWith(term) || term.startsWith(word))) ?? [term];
}

function matchesSearch(query: string, searchableText: string) {
  if (searchableText.includes(query)) return true;

  const searchableWords = searchableText.split(" ");
  return query.split(" ").every((term) =>
    getRelatedTerms(term).some((relatedTerm) =>
      searchableWords.some((word) => word.startsWith(relatedTerm) || relatedTerm.startsWith(word)),
    ),
  );
}

// Devuelve sugerencias breves para el buscador del encabezado.
export async function GET(request: NextRequest) {
  const query = normalizeText(request.nextUrl.searchParams.get("q") ?? "");

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await getProducts();
  const results = products
    .filter((product) => product.isActive)
    .filter((product) => {
      const searchableText = normalizeText([
        product.name,
        product.brand,
        product.category,
        product.subcategory,
        product.description,
        ...product.features,
        ...product.catalogPath.map((item) => item.name),
      ].join(" "));

      return matchesSearch(query, searchableText);
    })
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

  return NextResponse.json({ results });
}
