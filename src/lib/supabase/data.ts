import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { bankAccounts as fallbackBankAccounts, businessConfig as fallbackBusinessConfig, categories as fallbackCategories } from "@/data/mock-business";
import type { BankAccount, BusinessConfig } from "@/types/business";
import type { Order, OrderItem } from "@/types/order";
import type { Product, ProductCategory, ProductImage } from "@/types/product";

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

function toNumber(value: number | string | null | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

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

export async function getProducts() {
  const supabase = await createClient();
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
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const products = await getProducts();
  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.isActive &&
        candidate.categorySlug === product.categorySlug,
    )
    .slice(0, limit);
}

export async function getCategories(): Promise<ProductCategory[]> {
  const supabase = await createClient();
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
}

export async function getBrands() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marcas")
    .select("id, nombre, slug")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  return data ?? [];
}

export async function getAdminBrands() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("marcas")
    .select("id, nombre, slug, activa")
    .order("nombre", { ascending: true });

  return data ?? [];
}

export async function getBusinessConfig(): Promise<BusinessConfig> {
  return fallbackBusinessConfig;
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  return fallbackBankAccounts;
}

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
  const imagesByProduct = await getProductImagesByProductIds(
    supabase,
    products.map((row) => row.id),
  );

  return products.map((row) => {
    const category = categoryById.get(row.categoria_id);
    const subcategory = row.subcategoria_id ? subcategoryById.get(row.subcategoria_id) : null;
    const brand = row.marca_id ? brandById.get(row.marca_id) : null;

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

export async function getAdminProductById(id: string) {
  const products = await getAdminProducts();
  return products.find((product) => product.id === id) ?? null;
}

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
