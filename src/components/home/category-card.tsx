import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCategory } from "@/types/product";

interface CategoryCardProps {
  category: ProductCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/productos?categoria=${category.slug}`}
      className="group relative block min-h-[21rem] overflow-hidden rounded-lg border border-border bg-dark-blue shadow-sm transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute inset-0">
        <Image
          src={category.image}
          alt={`Categor\u00eda ${category.name}`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-dark-blue/55 to-dark-blue/10 transition-opacity group-hover:opacity-90" />
      </div>

      <div className="relative flex min-h-[21rem] flex-col justify-end p-6 sm:p-8">
        <span className="w-fit rounded-full border border-gold/50 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-light backdrop-blur">
          Categoría
        </span>
        <div className="mt-4 flex items-end justify-between gap-6">
          <div>
            <h3 className="text-3xl font-bold text-white sm:text-4xl">{category.name}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
              {category.description}
            </p>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-dark-blue transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
