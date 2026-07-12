import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { ProductGrid } from "@/components/products/cuadricula-productos";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { getCatalogLanding, getProductBySlug } from "@/lib/supabase/data";
import { SITE_URL } from "@/lib/constantes";

interface CatalogLandingPageProps {
  params: Promise<{ slug: string[] }>;
}

// Genera metadata basica con los campos que catalogo_nodos ya ofrece actualmente.
export async function generateMetadata({
  params,
}: CatalogLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getCatalogLanding(slug);

  if (!landing) {
    return {};
  }

  const pathname = `/productos/${slug.join("/")}`;
  const description =
    landing.content.metaDescription ||
    `Explora productos de ${landing.node.name} disponibles en Pesca Con Fe.`;

  return {
    title: landing.content.metaTitle,
    description,
    alternates: {
      canonical: pathname,
    },
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

// Landing definitiva: valida la ruta completa y muestra productos del nodo y sus descendientes.
export default async function CatalogLandingPage({ params }: CatalogLandingPageProps) {
  const { slug } = await params;
  const landing = await getCatalogLanding(slug);

  if (!landing) {
    if (slug.length === 1) {
      const legacyProduct = await getProductBySlug(slug[0]);

      if (legacyProduct) {
        permanentRedirect(`/producto/${legacyProduct.slug}`);
      }
    }

    notFound();
  }

  const description =
    landing.content.shortDescription ||
    `Descubre nuestra seleccion de ${landing.node.name.toLowerCase()} para tu proxima jornada de pesca.`;

  return (
    <PublicShell>
      <section className="border-b border-border bg-secondary/45 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
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
      </section>

      <section className="bg-dark-blue text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-light">
              {landing.node.level}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              {landing.content.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">{description}</p>
          </div>

          {landing.content.image ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-white/15 bg-white/5 shadow-2xl">
              <Image
                src={landing.content.image}
                alt={landing.content.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, calc(100vw - 32px)"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      {landing.children.length ? (
        <section className="border-b border-border bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Explora categorias relacionadas"
              description={`Continua navegando dentro de ${landing.node.name}.`}
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {landing.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/productos/${[...slug, child.slug].join("/")}`}
                  className="group rounded-lg border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {child.level}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-dark-blue group-hover:text-primary">
                    {child.name}
                  </h2>
                  {child.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {child.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {landing.content.technicalContent ? (
        <section className="border-b border-border bg-secondary/35 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black text-dark-blue">Informacion tecnica</h2>
            <div className="mt-4 whitespace-pre-line text-base leading-8 text-muted-foreground">
              {landing.content.technicalContent}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={`Productos de ${landing.node.name}`}
            description={`${landing.products.length} producto${landing.products.length === 1 ? "" : "s"} asociado${landing.products.length === 1 ? "" : "s"} a esta seccion del catalogo.`}
          />
          <div className="mt-8">
            <ProductGrid products={landing.products} />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
