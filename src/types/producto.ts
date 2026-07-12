export type CategorySlug = string;

export type BrandName = string;

// Modelos de producto, categoria e imagen usados en catalogo y admin.
export type ProductAvailability = "all" | "in-stock" | "low-stock" | "out-of-stock";

export interface ProductSubcategory {
  name: string;
  slug: string;
}

export interface CatalogNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  level: string;
  description: string;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  children: CatalogNode[];
}

export interface CatalogPathItem {
  id?: string;
  name: string;
  slug: string;
  level: string;
}

// Datos resueltos para renderizar una landing de un nodo y todo su subarbol.
export interface CatalogLanding {
  node: CatalogNode;
  breadcrumbs: CatalogPathItem[];
  children: CatalogNode[];
  products: Product[];
  content: CatalogLandingContent;
}

export interface CatalogLandingContent {
  title: string;
  shortDescription: string;
  technicalContent: string;
  image: string | null;
  imageAlt: string;
  metaTitle: string;
  metaDescription: string;
  openGraphImage: string | null;
  isIndexable: boolean;
}

export interface ProductCategory {
  name: string;
  slug: CategorySlug;
  description: string;
  image: string;
  subcategories: ProductSubcategory[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isMain?: boolean;
  publicId?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: BrandName;
  category: string;
  categorySlug: CategorySlug;
  subcategory: string;
  subcategorySlug: string;
  catalogNodeId?: string;
  catalogPath: CatalogPathItem[];
  price: number;
  stock: number;
  description: string;
  features: string[];
  images: ProductImage[];
  mainImage: string;
  imageAlt: string;
  youtubeVideoId?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
}
