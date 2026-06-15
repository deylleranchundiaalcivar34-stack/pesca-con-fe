import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/products/galeria-producto";
import { ProductDetailActions } from "@/components/products/acciones-detalle-producto";
import { ProductGrid } from "@/components/products/cuadricula-productos";
import { ProductJsonLd } from "@/components/shared/producto-json-ld";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { YouTubeEmbed } from "@/components/shared/video-youtube";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/supabase/data";
import { formatCurrency } from "@/lib/utilidades";
import { SITE_URL } from "@/lib/constantes";

// Genera metadatos SEO del producto segun su slug.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      url: `${SITE_URL}/productos/${product.slug}`,
      images: [{ url: product.mainImage, alt: product.imageAlt }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.mainImage],
    },
  };
}

// Pagina de detalle con galeria, compra, relacionados y video.
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <PublicShell>
      <ProductJsonLd product={product} />
      <section className="bg-[linear-gradient(180deg,#f1f7ff_0%,#ffffff_100%)] py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Link href="/productos" className="shrink-0 hover:text-primary">
              Productos
            </Link>
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{product.name}</span>
          </div>
        </div>
      </section>

      <section className="bg-white pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(390px,0.97fr)] lg:items-start lg:gap-12 lg:px-8">
          <ProductGallery product={product} />

          <div className="rounded-lg border border-border bg-white p-5 shadow-[0_18px_45px_rgb(13_110_253_/_0.1)] sm:p-6 lg:sticky lg:top-24">
            <div className="flex flex-wrap gap-2">
              <Badge variant="premium">{product.brand}</Badge>
              <Badge variant={product.stock > 0 ? "success" : "destructive"}>
                {product.stock > 0
                  ? `${product.stock} unidades disponibles`
                  : "Agotado"}
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-dark-blue sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-primary">
              {product.category} / {product.subcategory}
            </p>
            <p className="mt-5 text-4xl font-black text-dark-blue">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-7 border-t border-border pt-6">
              <ProductDetailActions product={product} />
            </div>

            <div className="mt-8 rounded-lg border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-dark-blue">Características</h2>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-2 size-1.5 rounded-full bg-gold" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {product.youtubeVideoId ? (
        <section className="bg-secondary py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Mira el producto en acción"
              description="Una referencia visual para conocer mejor sus detalles, proporciones y uso en pesca."
              align="center"
            />
            <div className="mt-8">
              <YouTubeEmbed
                videoId={product.youtubeVideoId}
                title={`Video de ${product.name}`}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="También puede interesarte"
            description="Opciones de la misma categoría para comparar y completar tu equipo."
          />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
