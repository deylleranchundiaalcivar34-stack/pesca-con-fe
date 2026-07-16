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

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function getRelatedSearchTerms(term: string) {
  return relatedTerms.find((group) =>
    group.some(
      (word) => word === term || word.startsWith(term) || term.startsWith(word),
    ),
  ) ?? [term];
}

export function getSearchTerms(query: string) {
  const normalizedQuery = normalizeSearchText(query);

  return Array.from(
    new Set(
      normalizedQuery
        .split(" ")
        .filter((term) => term.length >= 2)
        .flatMap(getRelatedSearchTerms),
    ),
  ).slice(0, 10);
}

export function matchesProductSearch(query: string, searchableText: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedSearchableText = normalizeSearchText(searchableText);

  if (normalizedSearchableText.includes(normalizedQuery)) return true;

  const searchableWords = normalizedSearchableText.split(" ");
  return normalizedQuery.split(" ").every((term) =>
    getRelatedSearchTerms(term).some((relatedTerm) =>
      searchableWords.some(
        (word) => word.startsWith(relatedTerm) || relatedTerm.startsWith(word),
      ),
    ),
  );
}
