import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { PaginatedProductGrid } from "@/components/products/listado-productos-paginado";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { getCatalogBanner } from "@/data/imagenes-catalogo";
import {
  getCatalogAttributes,
  getCatalogLanding,
  getCatalogNavigation,
  getProductBySlug,
} from "@/lib/supabase/data";
import { SITE_URL } from "@/lib/constantes";

interface CatalogLandingPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: CatalogLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getCatalogLanding(slug);

  if (!landing) return {};

  const pathname = `/productos/${slug.join("/")}`;
  const description =
    landing.content.metaDescription ||
    `Explora productos de ${landing.node.name} disponibles en Pesca Con Fe.`;

  return {
    title: landing.content.metaTitle,
    description,
    alternates: { canonical: pathname },
    openGraph: {
      title: landing.content.metaTitle,
      description,
      url: `${SITE_URL}${pathname}`,
      images: landing.content.openGraphImage
        ? [{ url: landing.content.openGraphImage, alt: landing.content.imageAlt }]
        : undefined,
      type: "website",
    },
    robots: landing.content.isIndexable ? undefined : { index: false, follow: true },
  };
}

// Landing del catálogo: contenido principal y clasificaciones en una sola cabecera.
export default async function CatalogLandingPage({ params }: CatalogLandingPageProps) {
  const { slug } = await params;
  const [landing, catalogAttributes, catalogNodes] = await Promise.all([
    getCatalogLanding(slug),
    getCatalogAttributes(),
    getCatalogNavigation(),
  ]);

  if (!landing) {
    if (slug.length === 1) {
      const legacyProduct = await getProductBySlug(slug[0]);
      if (legacyProduct) permanentRedirect(`/producto/${legacyProduct.slug}`);
    }

    notFound();
  }

  const description =
    landing.content.shortDescription ||
    `Descubre nuestra seleccion de ${landing.node.name.toLowerCase()} para tu proxima jornada de pesca.`;
  const catalogBanner = getCatalogBanner(slug);
  const backgroundImage = catalogBanner?.src ?? landing.content.image;
  const backgroundAlt = catalogBanner?.alt ?? landing.content.imageAlt ?? "";

  return (
    <PublicShell>
      <nav className="border-b border-border bg-secondary py-4" aria-label="Migas de pan">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Link href="/" className="font-medium transition-colors hover:text-primary">
            Inicio
          </Link>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          <Link href="/productos" className="font-medium hover:text-primary">
            Productos
          </Link>
          {landing.breadcrumbs.map((item, index) => {
            const href = `/productos/${landing.breadcrumbs
              .slice(0, index + 1)
              .map((breadcrumb) => breadcrumb.slug)
              .join("/")}`;
            const isCurrent = index === landing.breadcrumbs.length - 1;

            return (
              <span key={item.id ?? href} className="flex min-w-0 items-center gap-2">
                <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                {isCurrent ? (
                  <span className="truncate font-semibold text-dark-blue" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={href} className="truncate font-medium hover:text-primary">
                    {item.name}
                  </Link>
                )}
              </span>
            );
          })}
        </div>
      </nav>

      <article className="bg-secondary">
        <header className="relative isolate overflow-hidden border-b border-dark-blue/20 bg-dark-blue">
          {backgroundImage ? (
            <Image
              src={backgroundImage}
              alt={backgroundAlt}
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover opacity-50"
            />
          ) : null}
          <div className="absolute inset-0 -z-10 bg-dark-blue/75" />

          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(280px,390px)] lg:items-center lg:gap-16 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                {landing.node.level}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {landing.content.title.toLocaleUpperCase("es")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                {description}
              </p>
            </div>

            {landing.children.length ? (
              <aside className="rounded-xl border border-white/80 bg-white/80 p-5 shadow-lg backdrop-blur-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Clasificaciones
                </p>
                <div className="mt-3 divide-y divide-border/80">
                  {landing.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/productos/${[...slug, child.slug].join("/")}`}
                      className="group flex items-center justify-between gap-4 py-3 text-base font-black text-dark-blue transition-colors hover:text-primary"
                    >
                      <span>{child.name}</span>
                      <ChevronRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </aside>
            ) : null}
          </div>
        </header>

      </article>

      <section id="productos-disponibles" className="scroll-mt-20 bg-secondary py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Productos disponibles"
            description={`${landing.products.length} producto${landing.products.length === 1 ? "" : "s"} asociado${landing.products.length === 1 ? "" : "s"} a esta seccion del catalogo.`}
          />
          <div className="mt-8">
            <PaginatedProductGrid
              products={landing.products}
              attributes={catalogAttributes}
              catalogNodes={catalogNodes}
            />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
