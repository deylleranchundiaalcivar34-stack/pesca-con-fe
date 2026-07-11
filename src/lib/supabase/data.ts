import "server-only";

import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/publico";
import { createClient } from "@/lib/supabase/server";
import { bankAccounts as fallbackBankAccounts, businessConfig as fallbackBusinessConfig, categories as fallbackCategories } from "@/data/datos-negocio";
import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { Order, OrderItem } from "@/types/pedido";
import type {
  CatalogNode,
  CatalogPathItem,
  Product,
  ProductCategory,
  ProductImage,
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
  stock: number;
  descripcion: string;
  caracteristicas: string[] | null;
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

// Convierte una fila publica de producto al modelo que renderiza la tienda.
function mapProduct(row: DbProduct, images: ProductImage[] = []): Product {
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
    stock: row.stock,
    description: row.descripcion,
    features: row.caracteristicas ?? [],
    images: safeImages,
    mainImage: mainImage.url,
    imageAlt: mainImage.alt,
    youtubeVideoId: row.youtube_video_id ?? undefined,
    isFeatured: row.destacado,
    isActive: row.activo,
  };
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
      .order("destacado", { ascending: false })
      .order("nombre", { ascending: true });

    if (error || !data) {
      return [];
    }

    const rows = data as DbProduct[];
    const imagesByProduct = await getProductImagesByProductIds(
      supabase,
      rows.map((row) => row.id),
    );

    return rows.map((row) => mapProduct(row, imagesByProduct.get(row.id)));
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
    const imagesByProduct = await getProductImagesByProductIds(supabase, [row.id]);

    return mapProduct(row, imagesByProduct.get(row.id));
  },
  ["public-product-by-slug"],
  {
    tags: ["products"],
    revalidate: publicDataRevalidateSeconds,
  },
);

const getCachedRelatedProducts = unstable_cache(
  async (productId: string, categorySlug: string, limit: number) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("productos_publicos")
      .select("*")
      .eq("activo", true)
      .eq("categoria_slug", categorySlug)
      .neq("id", productId)
      .order("destacado", { ascending: false })
      .order("nombre", { ascending: true })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    const rows = data as DbProduct[];
    const imagesByProduct = await getProductImagesByProductIds(
      supabase,
      rows.map((row) => row.id),
    );

    return rows.map((row) => mapProduct(row, imagesByProduct.get(row.id)));
  },
  ["public-related-products"],
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

// Devuelve productos relacionados de la misma categoria.
export async function getRelatedProducts(product: Product, limit = 4) {
  return getCachedRelatedProducts(product.id, product.categorySlug, limit);
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
    .select("id, parent_id, nombre, slug, nivel, descripcion, imagen, activo, orden")
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
    );
  });
}

// Busca un producto admin por id para editarlo.
export async function getAdminProductById(id: string) {
  const products = await getAdminProducts();
  return products.find((product) => product.id === id) ?? null;
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
