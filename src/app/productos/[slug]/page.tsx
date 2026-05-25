import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductDetailActions } from "@/components/products/product-detail-actions";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductJsonLd } from "@/components/shared/product-json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/supabase/data";
import { formatCurrency } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";

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
      <section className="bg-secondary py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Link href="/productos" className="hover:text-primary">
            Productos
          </Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span>{product.name}</span>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <ProductGallery product={product} />

          <div>
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

            <Separator className="my-6" />
            <ProductDetailActions product={product} />

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
        <section className="bg-secondary py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Video"
              title="Mira el producto en acción"
              description="Video embebido mediante YouTube para futuras demostraciones reales del producto."
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

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Relacionados"
            title="También puede interesarte"
            description="Productos de la misma categoría para completar tu equipo."
          />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
