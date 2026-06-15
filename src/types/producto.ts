export type CategorySlug = string;

export type BrandName = string;

// Modelos de producto, categoria e imagen usados en catalogo y admin.
export type ProductAvailability = "all" | "in-stock" | "low-stock" | "out-of-stock";

export interface ProductSubcategory {
  name: string;
  slug: string;
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
