import Image from "next/image";
import Link from "next/link";
import type { ProductCategory } from "@/types/product";

interface CategoryCardProps {
  category: ProductCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/productos?categoria=${category.slug}`}
      aria-label={`Ver productos de ${category.name}`}
      className="group relative block aspect-[1.7/1] min-h-[15.5rem] overflow-hidden rounded-lg bg-dark-blue shadow-[0_18px_38px_rgb(5_44_101_/_0.16)] ring-1 ring-dark-blue/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgb(5_44_101_/_0.24)] hover:ring-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[1.95/1]"
    >
      <Image
        src={category.image}
        alt={`Categoría ${category.name}`}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.08),transparent_38%,rgb(5_44_101_/_0.12)),radial-gradient(circle_at_18%_15%,rgb(246_227_161_/_0.22),transparent_32%)] opacity-90 transition-opacity duration-300 group-hover:opacity-60" />
    </Link>
  );
}
