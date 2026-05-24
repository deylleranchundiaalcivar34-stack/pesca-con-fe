export type CategorySlug = "carrete" | "canas" | "indumentaria" | "senuelos";

export type BrandName =
  | "Bass Pro Shops"
  | "Daiwa"
  | "PENN"
  | "Rapala"
  | "Shimano"
  | "Ugly Stik"
  | "Okuma inspired Fishing"
  | "Marine High Performance";

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
  createdAt: string;
}
