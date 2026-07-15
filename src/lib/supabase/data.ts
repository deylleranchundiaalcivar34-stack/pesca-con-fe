import "server-only";

import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/publico";
import { createClient } from "@/lib/supabase/server";
import { bankAccounts as fallbackBankAccounts, businessConfig as fallbackBusinessConfig, categories as fallbackCategories } from "@/data/datos-negocio";
import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { Order, OrderItem } from "@/types/pedido";
import type {
  CatalogLanding,
  CatalogAttribute,
  CatalogNode,
  CatalogPathItem,
  Product,
  ProductCategory,
  ProductImage,
  ProductVariant,
} from "@/types/producto";

type DbProduct = {
  id: string;
  slug: string;
  nombre: string;
  sku: string;
  marca: string | null;
  categoria: string;
  categoria_slug: string;
  subcategoria: string | null;
  subcategoria_slug: string | null;
  catalogo_nodo_id?: string | null;
  catalogo_ruta_ids?: string[] | null;
  catalogo_ruta_nombres?: string[] | null;
  catalogo_ruta_slugs?: string[] | null;
  catalogo_ruta_niveles?: string[] | null;
  precio: number | string;
  precio_oferta: number | string | null;
  stock: number;
  descripcion: string;
  caracteristicas: string[] | null;
  atributos?: Record<string, unknown> | null;
  youtube_video_id: string | null;
  destacado: boolean;
  activo: boolean;
  imagen_principal: string | null;
  imagen_alt: string | null;
};

type DbCatalogNode = {
  id: string;
  parent_id: string | null;
  nombre: string;
  slug: string;
  nivel: string;
  descripcion: string | null;
  imagen: string | null;
  activo: boolean;
  orden: number;
  titulo_landing?: string | null;
  descripcion_corta?: string | null;
  contenido_tecnico?: string | null;
  imagen_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  open_graph_image?: string | null;
  indexable?: boolean | null;
  actualizado_en?: string | null;
};

type DbCatalogLandingContent = DbCatalogNode;

type DbCatalogAttribute = {
  id: string;
  catalogo_nodo_id: string;
  clave: string;
  etiqueta: string;
  tipo: CatalogAttribute["type"];
  unidad: string | null;
  opciones: string[] | null;
  obligatorio: boolean;
  filtrable: boolean;
  orden: number;
};

type DbImage = {
  id: string;
  producto_id: string;
  cloudinary_public_id: string;
  cloudinary_secure_url: string;
  alt: string;
  principal: boolean;
  orden: number;
  activo: boolean;
};

type DbProductVariant = {
  id: string;
  producto_id: string;
  nombre: string;
  descripcion: string | null;
  atributos?: Record<string, unknown> | null;
  sku: string | null;
  precio: number | string;
  precio_oferta: number | string | null;
  precio_adicional: number | string | null;
  stock: number;
  imagen: string | null;
  activo: boolean;
  orden: number;
};

const placeholderImage = "/images/products/product-placeholder.png";
// Mantiene el catalogo agil y limita a cinco minutos los datos obsoletos si Supabase
// cambia fuera del panel administrador, donde las etiquetas se invalidan al instante.
const publicDataRevalidateSeconds = 60 * 5;

// Normaliza numeros que pueden llegar como string desde Supabase.
function toNumber(value: number | string | null | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function buildCatalogPath(row: DbProduct): CatalogPathItem[] {
  const names = row.catalogo_ruta_nombres ?? [];
  const slugs = row.catalogo_ruta_slugs ?? [];
  const levels = row.catalogo_ruta_niveles ?? [];
  const ids = row.catalogo_ruta_ids ?? [];

  if (names.length && slugs.length) {
    return names.map((name, index) => ({
      id: ids[index],
      name,
      slug: slugs[index] ?? "",
      level: levels[index] ?? (index === 0 ? "Categoria" : "Nivel"),
    }));
  }

  return [
    {
      name: row.categoria,
      slug: row.categoria_slug,
      level: "Categoria",
    },
    row.subcategoria && row.subcategoria_slug
      ? {
          name: row.subcategoria,
          slug: row.subcategoria_slug,
          level: "Subcategoria",
        }
      : null,
  ].filter((item): item is CatalogPathItem => Boolean(item));
}

function buildCatalogTree(rows: DbCatalogNode[]): CatalogNode[] {
  const nodes = new Map<string, CatalogNode>();

  rows.forEach((row) => {
    nodes.set(row.id, {
      id: row.id,
      parentId: row.parent_id,
      name: row.nombre,
      slug: row.slug,
      level: row.nivel,
      description: row.descripcion ?? "",
      image: row.imagen,
      isActive: row.activo,
      sortOrder: row.orden,
      children: [],
      landingTitle: row.titulo_landing ?? "",
      shortDescription: row.descripcion_corta ?? "",
      technicalContent: row.contenido_tecnico ?? "",
      imageAlt: row.imagen_alt ?? "",
      metaTitle: row.meta_title ?? "",
      metaDescription: row.meta_description ?? "",
      openGraphImage: row.open_graph_image,
      isIndexable: row.indexable ?? true,
      updatedAt: row.actualizado_en ?? undefined,
    });
  });

  const roots: CatalogNode[] = [];

  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)?.children.push(node);
      return;
    }

    roots.push(node);
  });

  const sortNodes = (items: CatalogNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);
  return roots;
}

function fallbackCatalogNavigation(): CatalogNode[] {
  return fallbackCategories.map((category, categoryIndex) => ({
    id: `fallback-${category.slug}`,
    parentId: null,
    name: category.name,
    slug: category.slug,
    level: "Categoria",
    description: category.description,
    image: category.image,
    isActive: true,
    sortOrder: categoryIndex,
    children: category.subcategories.map((subcategory, subcategoryIndex) => ({
      id: `fallback-${category.slug}-${subcategory.slug}`,
      parentId: `fallback-${category.slug}`,
      name: subcategory.name,
      slug: subcategory.slug,
      level: "Tipo",
      description: "",
      image: null,
      isActive: true,
      sortOrder: subcategoryIndex,
      children: [],
    })),
  }));
}

function flattenCatalogNodes(
  nodes: CatalogNode[],
  path: CatalogPathItem[] = [],
): Map<string, CatalogPathItem[]> {
  const paths = new Map<string, CatalogPathItem[]>();

  for (const node of nodes) {
    const nextPath = [
      ...path,
      {
        id: node.id,
        name: node.name,
        slug: node.slug,
        level: node.level,
      },
    ];

    paths.set(node.id, nextPath);
    flattenCatalogNodes(node.children, nextPath).forEach((value, key) => {
      paths.set(key, value);
    });
  }

  return paths;
}

// Lista todos los caminos activos para sitemap y navegacion jerarquica.
function listCatalogPaths(
  nodes: CatalogNode[],
  parentPath: CatalogPathItem[] = [],
): CatalogPathItem[][] {
  return nodes.flatMap((node) => {
    const path = [
      ...parentPath,
      {
        id: node.id,
        name: node.name,
        slug: node.slug,
        level: node.level,
      },
    ];

    return [path, ...listCatalogPaths(node.children, path)];
  });
}

// Resuelve cada segmento dentro de sus hermanos para validar el camino completo.
function findCatalogNodeByPath(nodes: CatalogNode[], slugs: string[]) {
  const breadcrumbs: CatalogPathItem[] = [];
  let currentNodes = nodes;
  let currentNode: CatalogNode | undefined;

  for (const slug of slugs) {
    currentNode = currentNodes.find((node) => node.slug === slug && node.isActive);

    if (!currentNode) {
      return null;
    }

    breadcrumbs.push({
      id: currentNode.id,
      name: currentNode.name,
      slug: currentNode.slug,
      level: currentNode.level,
    });
    currentNodes = currentNode.children;
  }

  return currentNode ? { node: currentNode, breadcrumbs } : null;
}

// Comprueba que el producto pertenezca al nodo solicitado o a uno de sus descendientes.
function catalogPathStartsWith(
  productPath: CatalogPathItem[],
  selectedPath: CatalogPathItem[],
) {
  return selectedPath.every((selectedNode, index) => {
    const productNode = productPath[index];

    if (!productNode) {
      return false;
    }

    if (selectedNode.id && productNode.id) {
      return selectedNode.id === productNode.id;
    }

    return selectedNode.slug === productNode.slug;
  });
}

// Convierte una fila publica de producto al modelo que renderiza la tienda.
function mapProduct(
  row: DbProduct,
  images: ProductImage[] = [],
  variants: ProductVariant[] = [],
): Product {
  const safeImages = images.length
    ? images
    : [
        {
          id: `${row.id}-placeholder`,
          url: row.imagen_principal ?? placeholderImage,
          alt: row.imagen_alt ?? row.nombre,
          isMain: true,
        },
      ];
  const mainImage = safeImages.find((image) => image.isMain) ?? safeImages[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.nombre,
    sku: row.sku,
    brand: row.marca ?? "Sin marca",
    category: row.categoria,
    categorySlug: row.categoria_slug,
    subcategory: row.subcategoria ?? "General",
    subcategorySlug: row.subcategoria_slug ?? "general",
    catalogNodeId: row.catalogo_nodo_id ?? undefined,
    catalogPath: buildCatalogPath(row),
    price: toNumber(row.precio),
    offerPrice: row.precio_oferta == null ? undefined : toNumber(row.precio_oferta),
    stock: row.stock,
    description: row.descripcion,
    features: row.caracteristicas ?? [],
    attributes: Object.fromEntries(
      Object.entries(row.atributos ?? {}).flatMap(([key, value]) =>
        typeof value === "string" && value.trim() ? [[key, value]] : [],
      ),
    ),
    images: safeImages,
    variants,
    mainImage: mainImage.url,
    imageAlt: mainImage.alt,
    youtubeVideoId: row.youtube_video_id ?? undefined,
    isFeatured: row.destacado,
    isActive: row.activo,
  };
}

function mapProductVariants(rows: DbProductVariant[]): ProductVariant[] {
  return rows.map((variant) => ({
    id: variant.id,
    productId: variant.producto_id,
    name: variant.nombre,
    description: variant.descripcion ?? "",
    attributes: Object.fromEntries(
      Object.entries(variant.atributos ?? {}).flatMap(([key, value]) =>
        typeof value === "string" && value.trim() ? [[key, value]] : [],
      ),
    ),
    sku: variant.sku ?? "",
    price: toNumber(variant.precio),
    offerPrice: variant.precio_oferta == null ? undefined : toNumber(variant.precio_oferta),
    additionalPrice:
      variant.precio_adicional == null ? undefined : toNumber(variant.precio_adicional),
    stock: variant.stock,
    image: variant.imagen ?? undefined,
    isActive: variant.activo,
    sortOrder: variant.orden,
  }));
}

async function getPublicProductVariants(supabase: SupabaseClient, productId: string) {
  const { data } = await supabase
    .from("producto_variantes")
    .select("id, producto_id, nombre, descripcion, atributos, sku, precio, precio_oferta, precio_adicional, stock, imagen, activo, orden")
    .eq("producto_id", productId)
    .eq("activo", true)
    .order("orden", { ascending: true });

  return mapProductVariants((data ?? []) as DbProductVariant[]);
}

async function getProductVariantsByProductIds(
  supabase: SupabaseClient,
  productIds: string[],
  includeInactive = false,
) {
  if (!productIds.length) return new Map<string, ProductVariant[]>();

  let query = supabase
    .from("producto_variantes")
    .select("id, producto_id, nombre, descripcion, atributos, sku, precio, precio_oferta, precio_adicional, stock, imagen, activo, orden")
    .in("producto_id", productIds)
    .order("orden", { ascending: true });

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  const { data } = await query;
  const grouped = new Map<string, DbProductVariant[]>();

  for (const variant of (data ?? []) as DbProductVariant[]) {
    grouped.set(variant.producto_id, [...(grouped.get(variant.producto_id) ?? []), variant]);
  }

  return new Map(
    Array.from(grouped.entries()).map(([productId, variants]) => [
      productId,
      mapProductVariants(variants),
    ]),
  );
}

// Ordena y adapta las imagenes activas de un producto.
function mapImages(rows: DbImage[]) {
  return rows
    .filter((row) => row.activo)
    .sort((a, b) => Number(b.principal) - Number(a.principal) || a.orden - b.orden)
    .map<ProductImage>((row) => ({
      id: row.id,
      url: row.cloudinary_secure_url,
      alt: row.alt,
      isMain: row.principal,
      publicId: row.cloudinary_public_id,
    }));
}

// Carga las imagenes de varios productos en una sola consulta.
async function getProductImagesByProductIds(
  supabase: SupabaseClient,
  productIds: string[],
) {
  if (!productIds.length) {
    return new Map<string, ProductImage[]>();
  }

  const { data } = await supabase
    .from("producto_imagenes")
    .select("id, producto_id, cloudinary_public_id, cloudinary_secure_url, alt, principal, orden, activo")
    .in("producto_id", productIds)
    .eq("activo", true)
    .order("principal", { ascending: false })
    .order("orden", { ascending: true });

  const grouped = new Map<string, DbImage[]>();
  for (const image of (data ?? []) as DbImage[]) {
    grouped.set(image.producto_id, [...(grouped.get(image.producto_id) ?? []), image]);
  }

  return new Map(
    Array.from(grouped.entries()).map(([productId, rows]) => [productId, mapImages(rows)]),
  );
}

const getCachedProducts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("productos_publicos")
      .select("*")
      .order("nombre", { ascending: true });

    if (error || !data) {
      return [];
    }

    const rows = data as DbProduct[];
    const imagesByProduct = await getProductImagesByProductIds(
      supabase,
      rows.map((row) => row.id),
    );
    const variantsByProduct = await getProductVariantsByProductIds(
      supabase,
      rows.map((row) => row.id),
    );

    return rows.map((row) =>
      mapProduct(row, imagesByProduct.get(row.id), variantsByProduct.get(row.id)),
    );
  },
  ["public-products"],
  {
    tags: ["products"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedProductBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("productos_publicos")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as DbProduct;
    const [imagesByProduct, variants] = await Promise.all([
      getProductImagesByProductIds(supabase, [row.id]),
      getPublicProductVariants(supabase, row.id),
    ]);

    return mapProduct(row, imagesByProduct.get(row.id), variants);
  },
  ["public-product-by-slug"],
  {
    tags: ["products"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedProductSlugs = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("productos_publicos")
      .select("slug")
      .eq("activo", true)
      .order("slug", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => row.slug as string);
  },
  ["public-product-slugs"],
  {
    tags: ["products"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedCategories = unstable_cache(
  async (): Promise<ProductCategory[]> => {
    const supabase = createPublicClient();
    const { data: categories } = await supabase
      .from("categorias")
      .select("id, nombre, slug, activa")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    if (!categories?.length) {
      return fallbackCategories;
    }

    const { data: subcategories } = await supabase
      .from("subcategorias")
      .select("categoria_id, nombre, slug, activa")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    return categories.map((category) => ({
      name: category.nombre,
      slug: category.slug,
      description:
        fallbackCategories.find((fallback) => fallback.slug === category.slug)?.description ?? "",
      image:
        fallbackCategories.find((fallback) => fallback.slug === category.slug)?.image ??
        "/images/categorias/carretes.webp",
      subcategories: (subcategories ?? [])
        .filter((subcategory) => subcategory.categoria_id === category.id)
        .map((subcategory) => ({
          name: subcategory.nombre,
          slug: subcategory.slug,
        })),
    }));
  },
  ["public-categories"],
  {
    tags: ["categories"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedCatalogNavigation = unstable_cache(
  async (): Promise<CatalogNode[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("catalogo_nodos")
      .select("id, parent_id, nombre, slug, nivel, descripcion, imagen, activo, orden")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });

    if (error || !data?.length) {
      const categories = await getCachedCategories();
      return categories.map((category, categoryIndex) => ({
        id: `fallback-${category.slug}`,
        parentId: null,
        name: category.name,
        slug: category.slug,
        level: "Categoria",
        description: category.description,
        image: category.image,
        isActive: true,
        sortOrder: categoryIndex,
        children: category.subcategories.map((subcategory, subcategoryIndex) => ({
          id: `fallback-${category.slug}-${subcategory.slug}`,
          parentId: `fallback-${category.slug}`,
          name: subcategory.name,
          slug: subcategory.slug,
          level: "Tipo",
          description: "",
          image: null,
          isActive: true,
          sortOrder: subcategoryIndex,
          children: [],
        })),
      }));
    }

    return buildCatalogTree(data as DbCatalogNode[]);
  },
  ["public-catalog-navigation"],
  {
    tags: ["categories", "catalog"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedCatalogLandingContent = unstable_cache(
  async (nodeId: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("catalogo_nodos")
      .select("*")
      .eq("id", nodeId)
      .eq("activo", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as DbCatalogLandingContent;
  },
  ["public-catalog-landing-content"],
  {
    tags: ["catalog"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedBrands = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("marcas")
      .select("id, nombre, slug")
      .eq("activa", true)
      .order("nombre", { ascending: true });

    return data ?? [];
  },
  ["public-brands"],
  {
    tags: ["brands"],
    revalidate: publicDataRevalidateSeconds,
  },
);

// Lista productos visibles para catalogo, inicio y detalle.
export async function getProducts() {
  return getCachedProducts();
}

// Busca un producto publico por slug.
export async function getProductBySlug(slug: string) {
  return getCachedProductBySlug(slug);
}

// Prioriza la rama mas cercana del catalogo y luego sube hacia su categoria raiz.
export async function getRelatedProducts(product: Product, limit = 8) {
  const products = await getCachedProducts();
  const productPath = product.catalogPath.map((item) => item.id ?? item.slug);

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.catalogPath[0]?.slug === product.catalogPath[0]?.slug,
    )
    .map((candidate, originalIndex) => {
      const candidatePath = candidate.catalogPath.map((item) => item.id ?? item.slug);
      let commonDepth = 0;

      while (
        commonDepth < productPath.length &&
        productPath[commonDepth] === candidatePath[commonDepth]
      ) {
        commonDepth += 1;
      }

      return { candidate, commonDepth, originalIndex };
    })
    .sort(
      (left, right) =>
        right.commonDepth - left.commonDepth || left.originalIndex - right.originalIndex,
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

// Lista slugs activos para prerenderizar detalles de producto.
export async function getProductSlugs() {
  return getCachedProductSlugs();
}

// Carga categorias activas y usa datos locales como respaldo visual.
export async function getCategories(): Promise<ProductCategory[]> {
  return getCachedCategories();
}

// Carga el arbol de navegacion comercial del catalogo.
export async function getCatalogNavigation(): Promise<CatalogNode[]> {
  return getCachedCatalogNavigation();
}

// Carga definiciones activas que hacen variar el formulario y los filtros por categoría.
export async function getCatalogAttributes(): Promise<CatalogAttribute[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("catalogo_atributos")
    .select("id, catalogo_nodo_id, clave, etiqueta, tipo, unidad, opciones, obligatorio, filtrable, orden")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("etiqueta", { ascending: true });

  if (error) return [];

  return (data as DbCatalogAttribute[]).map((attribute) => ({
    id: attribute.id,
    catalogNodeId: attribute.catalogo_nodo_id,
    key: attribute.clave,
    label: attribute.etiqueta,
    type: attribute.tipo,
    unit: attribute.unidad ?? undefined,
    options: attribute.opciones ?? [],
    isRequired: attribute.obligatorio,
    isFilterable: attribute.filtrable,
    sortOrder: attribute.orden,
  }));
}

// Obtiene valores estructurados para conservarlos al editar un producto.
export async function getAdminProductAttributes(productId: string): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producto_atributos")
    .select("valor, catalogo_atributos!inner(clave)")
    .eq("producto_id", productId);

  if (error) return {};

  return Object.fromEntries(
    (data ?? []).flatMap((row) => {
      const relation = row.catalogo_atributos as unknown as { clave?: string } | null;
      return relation?.clave && row.valor ? [[relation.clave, row.valor]] : [];
    }),
  );
}

// Resuelve una landing por su ruta jerarquica y agrega productos de todo el subarbol.
export async function getCatalogLanding(slugs: string[]): Promise<CatalogLanding | null> {
  if (!slugs.length || slugs.some((slug) => !slug.trim())) {
    return null;
  }

  const [catalogNodes, products] = await Promise.all([
    getCachedCatalogNavigation(),
    getCachedProducts(),
  ]);
  const resolved = findCatalogNodeByPath(catalogNodes, slugs);

  if (!resolved) {
    return null;
  }

  const contentRow = await getCachedCatalogLandingContent(resolved.node.id);
  const shortDescription =
    contentRow?.descripcion_corta?.trim() || resolved.node.description;
  const title = contentRow?.titulo_landing?.trim() || resolved.node.name;

  return {
    node: resolved.node,
    breadcrumbs: resolved.breadcrumbs,
    children: resolved.node.children,
    products: products.filter(
      (product) => product.isActive && catalogPathStartsWith(product.catalogPath, resolved.breadcrumbs),
    ),
    content: {
      title,
      shortDescription,
      technicalContent: contentRow?.contenido_tecnico?.trim() || "",
      image: contentRow?.imagen ?? resolved.node.image,
      imageAlt: contentRow?.imagen_alt?.trim() || title,
      metaTitle: contentRow?.meta_title?.trim() || title,
      metaDescription: contentRow?.meta_description?.trim() || shortDescription,
      openGraphImage: contentRow?.open_graph_image ?? contentRow?.imagen ?? resolved.node.image,
      isIndexable: contentRow?.indexable ?? true,
    },
  };
}

// Devuelve las rutas completas de todos los nodos activos del catalogo.
export async function getCatalogPaths(): Promise<CatalogPathItem[][]> {
  return listCatalogPaths(await getCachedCatalogNavigation());
}

// Lista marcas activas para filtros y formularios.
export async function getBrands() {
  return getCachedBrands();
}

// Lista marcas del panel admin, incluyendo inactivas.
export async function getAdminBrands() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marcas")
    .select("id, nombre, slug, activa")
    .order("nombre", { ascending: true });

  return data ?? [];
}

// Lista nodos del catalogo para administracion, incluyendo inactivos.
export async function getAdminCatalogNodes(): Promise<CatalogNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogo_nodos")
    .select(
      "id, parent_id, nombre, slug, nivel, descripcion, imagen, activo, orden, titulo_landing, descripcion_corta, contenido_tecnico, imagen_alt, meta_title, meta_description, open_graph_image, indexable, actualizado_en",
    )
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error || !data?.length) {
    return fallbackCatalogNavigation();
  }

  return buildCatalogTree(data as DbCatalogNode[]);
}

// Devuelve la configuracion comercial usada en checkout y datos estructurados.
export async function getBusinessConfig(): Promise<BusinessConfig> {
  return fallbackBusinessConfig;
}

// Devuelve cuentas bancarias disponibles para transferencias.
export async function getBankAccounts(): Promise<BankAccount[]> {
  return fallbackBankAccounts;
}

// Carga productos para administracion con nombres de categoria, subcategoria y marca.
export async function getAdminProducts() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("productos")
    .select("*")
    .order("nombre", { ascending: true });

  if (!products?.length) {
    return [];
  }

  const [{ data: categories }, { data: subcategories }, { data: brands }] =
    await Promise.all([
      supabase.from("categorias").select("id, nombre, slug"),
      supabase.from("subcategorias").select("id, nombre, slug"),
      supabase.from("marcas").select("id, nombre, slug"),
    ]);

  const categoryById = new Map((categories ?? []).map((item) => [item.id, item]));
  const subcategoryById = new Map((subcategories ?? []).map((item) => [item.id, item]));
  const brandById = new Map((brands ?? []).map((item) => [item.id, item]));
  const catalogPathsById = flattenCatalogNodes(await getAdminCatalogNodes());
  const imagesByProduct = await getProductImagesByProductIds(
    supabase,
    products.map((row) => row.id),
  );
  const variantsByProduct = await getProductVariantsByProductIds(
    supabase,
    products.map((row) => row.id),
    true,
  );

  return products.map((row) => {
    const category = categoryById.get(row.categoria_id);
    const subcategory = row.subcategoria_id ? subcategoryById.get(row.subcategoria_id) : null;
    const brand = row.marca_id ? brandById.get(row.marca_id) : null;
    const catalogPath = row.catalogo_nodo_id
      ? catalogPathsById.get(row.catalogo_nodo_id)
      : undefined;

    return mapProduct(
      {
        id: row.id,
        slug: row.slug,
        nombre: row.nombre,
        sku: row.sku,
        marca: brand?.nombre ?? null,
        categoria: category?.nombre ?? "Sin categoría",
        categoria_slug: category?.slug ?? "sin-categoria",
        subcategoria: subcategory?.nombre ?? null,
        subcategoria_slug: subcategory?.slug ?? null,
        catalogo_nodo_id: row.catalogo_nodo_id ?? null,
        catalogo_ruta_ids: catalogPath?.map((item) => item.id ?? "") ?? null,
        catalogo_ruta_nombres: catalogPath?.map((item) => item.name) ?? null,
        catalogo_ruta_slugs: catalogPath?.map((item) => item.slug) ?? null,
        catalogo_ruta_niveles: catalogPath?.map((item) => item.level) ?? null,
        precio: row.precio,
        precio_oferta: row.precio_oferta,
        stock: row.stock,
        descripcion: row.descripcion,
        caracteristicas: row.caracteristicas,
        youtube_video_id: row.youtube_video_id,
        destacado: row.destacado,
        activo: row.activo,
        imagen_principal: null,
        imagen_alt: null,
      },
      imagesByProduct.get(row.id),
      variantsByProduct.get(row.id),
    );
  });
}

// Busca un producto admin por id para editarlo.
export async function getAdminProductById(id: string) {
  const products = await getAdminProducts();
  return products.find((product) => product.id === id) ?? null;
}

// Carga todas las opciones de un producto para su editor administrativo.
export async function getAdminProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producto_variantes")
    .select("id, producto_id, nombre, descripcion, atributos, sku, precio, precio_oferta, precio_adicional, stock, imagen, activo, orden")
    .eq("producto_id", productId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((variant) => ({
    id: variant.id,
    productId: variant.producto_id,
    name: variant.nombre,
    description: variant.descripcion ?? "",
    attributes: Object.fromEntries(
      Object.entries(variant.atributos ?? {}).flatMap(([key, value]) =>
        typeof value === "string" && value.trim() ? [[key, value]] : [],
      ),
    ),
    sku: variant.sku ?? "",
    price: toNumber(variant.precio),
    offerPrice: variant.precio_oferta == null ? undefined : toNumber(variant.precio_oferta),
    additionalPrice: variant.precio_adicional == null ? undefined : toNumber(variant.precio_adicional),
    stock: variant.stock,
    image: variant.imagen ?? undefined,
    isActive: variant.activo,
    sortOrder: variant.orden,
  }));
}

// Carga pedidos para el panel administrativo.
export async function getAdminOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("pedidos")
    .select("*")
    .order("creado_en", { ascending: false });

  if (!orders?.length) {
    return [];
  }

  const { data: items } = await supabase
    .from("pedido_items")
    .select("*")
    .in(
      "pedido_id",
      orders.map((order) => order.id),
    );

  return orders.map((order) => ({
    id: order.id,
    code: order.codigo,
    customer: {
      fullName: order.cliente_nombre_completo,
      cedula: order.cliente_cedula ?? undefined,
      phone: order.cliente_celular,
      email: order.cliente_correo ?? undefined,
      province: order.cliente_provincia ?? undefined,
      city: order.cliente_ciudad ?? undefined,
      address: order.cliente_direccion ?? undefined,
      deliveryReference: order.cliente_referencia_entrega ?? undefined,
    },
    items: ((items ?? []) as Array<Record<string, unknown>>)
      .filter((item) => item.pedido_id === order.id)
      .map<OrderItem>((item) => ({
        productId: String(item.producto_id ?? item.id),
        variantId: typeof item.variante_id === "string" ? item.variante_id : undefined,
        variantName:
          typeof item.variante_nombre === "string" ? item.variante_nombre : undefined,
        variantSku: typeof item.variante_sku === "string" ? item.variante_sku : undefined,
        productName: String(item.producto_nombre),
        productSlug: String(item.producto_slug),
        image: typeof item.producto_imagen === "string" ? item.producto_imagen : placeholderImage,
        price: toNumber(item.precio as number | string | null | undefined),
        quantity: Number(item.cantidad ?? 0),
        categorySlug: String(item.categoria_slug),
      })),
    subtotal: toNumber(order.subtotal),
    shipping: toNumber(order.envio),
    total: toNumber(order.total),
    status: order.estado,
    deliveryType: order.tipo_entrega,
    createdAt: order.creado_en,
  }));
}

// Carga pedidos asociados a un cliente autenticado.
export async function getCustomerOrders(userId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("pedidos")
    .select("*")
    .eq("cliente_id", userId)
    .order("creado_en", { ascending: false });

  if (!orders?.length) {
    return [];
  }

  const { data: items } = await supabase
    .from("pedido_items")
    .select("*")
    .in(
      "pedido_id",
      orders.map((order) => order.id),
    );

  return orders.map((order) => ({
    id: order.id,
    code: order.codigo,
    customer: {
      fullName: order.cliente_nombre_completo,
      cedula: order.cliente_cedula ?? undefined,
      phone: order.cliente_celular,
      email: order.cliente_correo ?? undefined,
      province: order.cliente_provincia ?? undefined,
      city: order.cliente_ciudad ?? undefined,
      address: order.cliente_direccion ?? undefined,
      deliveryReference: order.cliente_referencia_entrega ?? undefined,
    },
    items: ((items ?? []) as Array<Record<string, unknown>>)
      .filter((item) => item.pedido_id === order.id)
      .map<OrderItem>((item) => ({
        productId: String(item.producto_id ?? item.id),
        variantId: typeof item.variante_id === "string" ? item.variante_id : undefined,
        variantName:
          typeof item.variante_nombre === "string" ? item.variante_nombre : undefined,
        variantSku: typeof item.variante_sku === "string" ? item.variante_sku : undefined,
        productName: String(item.producto_nombre),
        productSlug: String(item.producto_slug),
        image: typeof item.producto_imagen === "string" ? item.producto_imagen : placeholderImage,
        price: toNumber(item.precio as number | string | null | undefined),
        quantity: Number(item.cantidad ?? 0),
        categorySlug: String(item.categoria_slug),
      })),
    subtotal: toNumber(order.subtotal),
    shipping: toNumber(order.envio),
    total: toNumber(order.total),
    status: order.estado,
    deliveryType: order.tipo_entrega,
    createdAt: order.creado_en,
  }));
}
