import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { InteractiveProductDetail } from "@/components/products/detalle-producto-interactivo";
import { VariantComparison } from "@/components/products/comparador-variantes";
import { RelatedProducts } from "@/components/products/productos-relacionados";
import { ProductJsonLd } from "@/components/shared/producto-json-ld";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { YouTubeEmbed } from "@/components/shared/video-youtube";
import {
  getProductBySlug,
  getCatalogAttributes,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/supabase/data";
import { SITE_URL } from "@/lib/constantes";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

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
      url: `${SITE_URL}/producto/${product.slug}`,
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
  const [product, catalogAttributes] = await Promise.all([
    getProductBySlug(slug),
    getCatalogAttributes(),
  ]);

  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const variantAttributes = catalogAttributes.filter(
    (attribute) => attribute.catalogNodeId === product.catalogPath[0]?.id,
  );
  const supportsVariantComparison = ["canas", "carrete", "carretes", "combos"].includes(
    product.categorySlug,
  );
  const hasProductOptions = product.variants.length > 0;
  const hasVariantComparison = product.variants.length > 1 && supportsVariantComparison;
  const descriptionPanel = (
    <div className="rounded-xl border border-border bg-secondary p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black text-dark-blue">Descripción</h2>
      <p className="mt-4 whitespace-pre-line text-base leading-8 text-muted-foreground">
        {product.description}
      </p>
    </div>
  );
  const plainDescriptionPanel = (
    <div className="rounded-xl border border-border bg-secondary p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Detalles del producto</p>
      <h2 className="mt-3 text-3xl font-black text-dark-blue">Descripción</h2>
      <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground">
        {product.description}
      </p>
    </div>
  );
  const constructionPanel = (
    <div className="rounded-xl border border-border bg-secondary p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black text-dark-blue">
        {hasProductOptions ? "Construcción y materiales" : "Especificaciones"}
      </h2>
      {product.features.length ? (
        <ul className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
              <span className="leading-6">{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {hasProductOptions
            ? "Consulta con nuestro equipo para conocer materiales y detalles de construcción."
            : "Consulta con nuestro equipo para conocer las especificaciones de este producto."}
        </p>
      )}
    </div>
  );

  return (
    <PublicShell>
      <ProductJsonLd product={product} />

      <nav className="border-b border-border bg-white py-4" aria-label="Migas de pan">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-muted-foreground">
            <Link href="/" className="shrink-0 hover:text-primary">
              Inicio
            </Link>
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            <Link href="/productos" className="shrink-0 hover:text-primary">
              Productos
            </Link>
            {product.catalogPath.map((item, index) => (
              <span key={item.id ?? `${item.slug}-${index}`} className="flex min-w-0 items-center gap-2">
                <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                <Link
                  href={`/productos/${product.catalogPath
                    .slice(0, index + 1)
                    .map((pathItem) => pathItem.slug)
                    .join("/")}`}
                  className="truncate hover:text-primary"
                >
                  {item.name}
                </Link>
              </span>
            ))}
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate" aria-current="page">{product.name}</span>
          </div>
        </div>
      </nav>

      <section className="bg-white pb-10 pt-5 sm:pb-12 sm:pt-6">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(460px,0.97fr)] lg:items-start lg:gap-10 lg:px-8">
          <InteractiveProductDetail product={product} variantAttributes={variantAttributes} />
        </div>
      </section>

      <section className="border-y border-border !bg-white py-8 sm:py-10">
        {hasVariantComparison ? (
          <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
            {descriptionPanel}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
              <div id="comparar-especificaciones" className="scroll-mt-28 overflow-hidden rounded-xl border border-border bg-secondary shadow-sm">
                <div className="border-b border-border px-5 py-4 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Opciones disponibles</p>
                  <h2 className="mt-1 text-lg font-black text-dark-blue">Comparar especificaciones</h2>
                </div>
                <VariantComparison product={product} attributes={variantAttributes} />
              </div>
              {constructionPanel}
            </div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-8">
            {plainDescriptionPanel}
            {constructionPanel}
          </div>
        )}
      </section>

      {product.youtubeVideoId ? (
        <section className="bg-dark-blue bg-[linear-gradient(rgb(5_44_101_/_0.78),rgb(5_44_101_/_0.78)),url('/images/banners/banner-3.webp')] bg-cover bg-center py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Mira el producto en acción"
              description="Una referencia visual para conocer mejor sus detalles, proporciones y uso en pesca."
              align="center"
              className="[&_h2]:text-white [&_p]:text-white/80"
            />
            <div className="mt-8">
              <YouTubeEmbed videoId={product.youtubeVideoId} title={`Video de ${product.name}`} />
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="También puede interesarte"
              description="Productos de la misma rama del catálogo, priorizados desde la clasificación más cercana."
            />
            <div className="mt-8">
              <RelatedProducts products={related} />
            </div>
          </div>
        </section>
      ) : null}
    </PublicShell>
  );
}
