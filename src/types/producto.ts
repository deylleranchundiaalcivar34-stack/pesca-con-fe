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
  landingTitle?: string;
  shortDescription?: string;
  technicalContent?: string;
  imageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  openGraphImage?: string | null;
  isIndexable?: boolean;
  updatedAt?: string;
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

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  description: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  offerPrice?: number;
  additionalPrice?: number;
  stock: number;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogAttribute {
  id: string;
  catalogNodeId: string;
  key: string;
  label: string;
  type: "texto" | "numero" | "seleccion";
  unit?: string;
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
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
  offerPrice?: number;
  stock: number;
  description: string;
  features: string[];
  attributes: Record<string, string>;
  images: ProductImage[];
  variants: ProductVariant[];
  mainImage: string;
  imageAlt: string;
  youtubeVideoId?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
}
