export interface ProductSearchLinkSuggestion {
  label: string;
  href: string;
}

export interface ProductSearchSource {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  catalogPath: Array<{
    name: string;
    slug: string;
    level: string;
  }>;
  attributes: Record<string, string>;
  variants: Array<{
    name: string;
    attributes: Record<string, string>;
    isActive: boolean;
  }>;
}

interface SearchSuggestionGroup {
  triggers: string[];
  suggestions: ProductSearchLinkSuggestion[];
}

const searchSuggestionGroups: SearchSuggestionGroup[] = [
  {
    triggers: ["trolling", "troling", "currican", "curricanes"],
    suggestions: [
      { label: "Trolling", href: "/productos?busqueda=Trolling" },
      { label: "Curricanes", href: "/productos?busqueda=Curricanes" },
      { label: "Señuelos para mar", href: "/productos/senuelos/para-mar" },
    ],
  },
  {
    triggers: [
      "senuelo",
      "senuelos",
      "carnada",
      "carnadas",
      "jig",
      "jigging",
      "minnow",
    ],
    suggestions: [
      { label: "Señuelos", href: "/productos?busqueda=Se%C3%B1uelos" },
      { label: "Señuelos para mar", href: "/productos/senuelos/para-mar" },
      { label: "Trolling", href: "/productos?busqueda=Trolling" },
    ],
  },
  {
    triggers: ["cana", "canas", "vara", "varas"],
    suggestions: [{ label: "Cañas", href: "/productos?busqueda=Ca%C3%B1as" }],
  },
  {
    triggers: ["carrete", "carretes", "reel", "reels", "molinete", "molinetes"],
    suggestions: [{ label: "Carretes", href: "/productos?busqueda=Carretes" }],
  },
  {
    triggers: [
      "linea",
      "lineas",
      "hilo",
      "hilos",
      "braid",
      "trenzado",
      "monofilamento",
      "leader",
      "leaders",
    ],
    suggestions: [
      {
        label: "Líneas y aparejos",
        href: "/productos?busqueda=L%C3%ADneas%20y%20aparejos",
      },
    ],
  },
  {
    triggers: ["combo", "combos", "kit", "kits", "set"],
    suggestions: [{ label: "Combos", href: "/productos?busqueda=Combos" }],
  },
  {
    triggers: [
      "herramienta",
      "herramientas",
      "alicate",
      "alicates",
      "pinza",
      "pinzas",
      "tijera",
      "tijeras",
      "bascula",
      "basculas",
    ],
    suggestions: [
      {
        label: "Herramientas y accesorios",
        href: "/productos?busqueda=Herramientas%20y%20accesorios",
      },
    ],
  },
  {
    triggers: [
      "indumentaria",
      "ropa",
      "jersey",
      "gorra",
      "gorras",
      "pantalon",
      "pantalones",
      "buff",
      "mascara",
      "mascaras",
    ],
    suggestions: [
      { label: "Indumentaria", href: "/productos?busqueda=Indumentaria" },
    ],
  },
  {
    triggers: [
      "camping",
      "carpa",
      "carpas",
      "equipamiento",
      "mochila",
      "mochilas",
      "tula",
      "tulas",
      "bolso",
      "bolsos",
    ],
    suggestions: [{ label: "Camping", href: "/productos?busqueda=Camping" }],
  },
];

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getTermCandidates(term: string) {
  const candidates = [term];

  if (term.length >= 5 && term.endsWith("es")) {
    candidates.push(term.slice(0, -1), term.slice(0, -2));
  } else if (term.length >= 4 && term.endsWith("s")) {
    candidates.push(term.slice(0, -1));
  }

  return candidates.filter((candidate) => candidate.length >= 2);
}

export function getSearchTerms(query: string) {
  const normalizedQuery = normalizeSearchText(query);

  return Array.from(
    new Set(
      normalizedQuery
        .split(" ")
        .filter((term) => term.length >= 2)
        .flatMap(getTermCandidates),
    ),
  ).slice(0, 10);
}

function wordMatchesQuery(textWord: string, queryTerm: string) {
  if (textWord === queryTerm || textWord.startsWith(queryTerm)) return true;

  return (
    queryTerm.startsWith(textWord) &&
    queryTerm.length - textWord.length <= 2
  );
}

function getTextSearchRank(query: string, value: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedQuery) return 0;
  if (!normalizedValue) return null;
  if (normalizedValue === normalizedQuery) return 0;
  if (normalizedValue.startsWith(`${normalizedQuery} `)) return 1;
  if (normalizedValue.includes(normalizedQuery)) return 2;

  const valueWords = normalizedValue.split(" ");
  const queryTerms = normalizedQuery.split(" ");

  return queryTerms.every((queryTerm) =>
    valueWords.some((valueWord) => wordMatchesQuery(valueWord, queryTerm)),
  )
    ? 3
    : null;
}

export function getProductTitleSearchRank(query: string, productTitle: string) {
  return getTextSearchRank(query, productTitle);
}

export function matchesProductTitleSearch(query: string, productTitle: string) {
  return getProductTitleSearchRank(query, productTitle) !== null;
}

function getProductAttributeEntries(product: ProductSearchSource) {
  return [
    ...Object.entries(product.attributes),
    ...product.variants
      .filter((variant) => variant.isActive)
      .flatMap((variant) => Object.entries(variant.attributes)),
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()));
}

export function getProductCatalogPathKeys(product: ProductSearchSource) {
  if (product.catalogPath.length) {
    return product.catalogPath.map((_, index) =>
      product.catalogPath
        .slice(0, index + 1)
        .map((item) => item.slug)
        .join("/"),
    );
  }

  const categorySlug = product.categorySlug?.trim();
  const subcategorySlug = product.subcategorySlug?.trim();
  if (!categorySlug) return [];

  return [
    categorySlug,
    ...(subcategorySlug && subcategorySlug !== "general"
      ? [`${categorySlug}/${subcategorySlug}`]
      : []),
  ];
}

export function getProductSearchRank(
  query: string,
  product: ProductSearchSource,
) {
  const titleRank = getProductTitleSearchRank(query, product.name);
  if (titleRank !== null) return titleRank;

  const rankedGroups = [
    { offset: 4, values: [product.brand] },
    {
      offset: 8,
      values: [
        product.category,
        product.subcategory,
        ...product.catalogPath.flatMap((item) => [item.name, item.slug]),
      ],
    },
    {
      offset: 12,
      values: getProductAttributeEntries(product).flatMap(([key, value]) => [
        key,
        value,
      ]),
    },
  ];

  for (const group of rankedGroups) {
    const ranks = group.values
      .map((value) => getTextSearchRank(query, value ?? ""))
      .filter(
        (rank): rank is NonNullable<ReturnType<typeof getTextSearchRank>> =>
          rank !== null,
      );

    if (ranks.length) return group.offset + Math.min(...ranks);
  }

  const combinedStructuredText = [
    product.brand,
    product.category,
    product.subcategory,
    ...product.catalogPath.map((item) => item.name),
    ...getProductAttributeEntries(product).flatMap(([key, value]) => [key, value]),
  ].join(" ");
  const combinedRank = getTextSearchRank(query, combinedStructuredText);

  return combinedRank === null ? null : 16 + combinedRank;
}

export function matchesProductSearch(
  query: string,
  product: ProductSearchSource,
) {
  return getProductSearchRank(query, product) !== null;
}

export function rankProductsForSearch<T extends ProductSearchSource>(
  query: string,
  products: T[],
) {
  if (!normalizeSearchText(query)) {
    return products.map((product) => ({ product, rank: 0 }));
  }

  return products
    .map((product) => ({ product, rank: getProductSearchRank(query, product) }))
    .filter(
      (entry): entry is { product: T; rank: number } => entry.rank !== null,
    )
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        left.product.name.localeCompare(right.product.name, "es"),
    );
}

function getEditDistance(left: string, right: string) {
  const previousRow = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previousAbove = previousRow[rightIndex];
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      previousRow[rightIndex] = Math.min(
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + 1,
        previousDiagonal + substitutionCost,
      );
      previousDiagonal = previousAbove;
    }
  }

  return previousRow[right.length];
}

function getSuggestionTriggerScore(queryTerm: string, trigger: string) {
  if (queryTerm === trigger) return 0;
  if (
    queryTerm.length >= 3 &&
    (queryTerm.startsWith(trigger) || trigger.startsWith(queryTerm))
  ) {
    return 1;
  }

  const maximumDistance = Math.max(queryTerm.length, trigger.length) >= 7 ? 2 : 1;
  return getEditDistance(queryTerm, trigger) <= maximumDistance ? 2 : null;
}

function getSuggestionLabelScore(query: string, label: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedLabel = normalizeSearchText(label);
  const queryTerms = normalizedQuery.split(" ").filter(Boolean);
  const labelTerms = normalizedLabel.split(" ").filter(Boolean);

  if (!normalizedQuery || !normalizedLabel || normalizedQuery === normalizedLabel) {
    return null;
  }

  const scores = [
    getSuggestionTriggerScore(normalizedQuery, normalizedLabel),
    ...queryTerms.flatMap((queryTerm) =>
      labelTerms.map((labelTerm) =>
        getSuggestionTriggerScore(queryTerm, labelTerm),
      ),
    ),
  ].filter((score): score is number => score !== null);

  return scores.length ? Math.min(...scores) : null;
}

function getProductSearchVocabulary(products: ProductSearchSource[]) {
  const labels = new Set<string>();

  for (const product of products) {
    [product.brand, product.category, product.subcategory].forEach((label) => {
      if (label && label !== "General" && label !== "Sin marca") labels.add(label);
    });
    product.catalogPath.forEach((item) => labels.add(item.name));
    getProductAttributeEntries(product).forEach(([, value]) => {
      if (/\p{L}/u.test(value) && value.length <= 60) labels.add(value);
    });
  }

  return [...labels];
}

export function getRelatedSearchSuggestions(
  query: string,
  products: ProductSearchSource[] = [],
  limit = 3,
) {
  const queryTerms = normalizeSearchText(query)
    .split(" ")
    .filter((term) => term.length >= 2);

  if (!queryTerms.length) return [];

  const dynamicSuggestions = getProductSearchVocabulary(products)
    .map((label) => ({
      label,
      href: `/productos?busqueda=${encodeURIComponent(label)}`,
      score: getSuggestionLabelScore(query, label),
    }))
    .filter(
      (suggestion): suggestion is ProductSearchLinkSuggestion & { score: number } =>
        suggestion.score !== null,
    )
    .sort(
      (left, right) =>
        left.score - right.score || left.label.localeCompare(right.label, "es"),
    );

  const matchingGroups = searchSuggestionGroups
    .map((group) => ({
      group,
      score: Math.min(
        ...queryTerms.flatMap((queryTerm) =>
          group.triggers.map(
            (trigger) =>
              getSuggestionTriggerScore(queryTerm, trigger) ??
              Number.POSITIVE_INFINITY,
          ),
        ),
      ),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => left.score - right.score);

  const uniqueSuggestions = new Map<string, ProductSearchLinkSuggestion>();

  for (const suggestion of dynamicSuggestions) {
    const normalizedLabel = normalizeSearchText(suggestion.label);
    if (!uniqueSuggestions.has(normalizedLabel)) {
      uniqueSuggestions.set(normalizedLabel, {
        label: suggestion.label,
        href: suggestion.href,
      });
    }
  }

  for (const { group } of matchingGroups) {
    for (const suggestion of group.suggestions) {
      const normalizedLabel = normalizeSearchText(suggestion.label);
      if (!uniqueSuggestions.has(normalizedLabel)) {
        uniqueSuggestions.set(normalizedLabel, suggestion);
      }
    }
  }

  return Array.from(uniqueSuggestions.values()).slice(0, Math.max(0, limit));
}
