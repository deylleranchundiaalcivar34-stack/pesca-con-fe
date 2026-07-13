import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
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
  const hideRodsLandingDetails = slug.length === 1 && landing.node.slug === "canas";
  const landingImage = hideRodsLandingDetails ? null : landing.content.image;
  const showTechnicalContent = Boolean(landing.content.technicalContent) && !hideRodsLandingDetails;

  return (
    <PublicShell>
      <nav className="border-b border-border bg-white py-4" aria-label="Migas de pan">
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

      <article className="bg-white">
        <header className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
          {landingImage ? (
            <div className="relative mx-auto aspect-[16/7] min-h-64 overflow-hidden rounded-2xl bg-secondary shadow-sm sm:min-h-80">
              <Image
                src={landingImage}
                alt={landing.content.imageAlt}
                fill
                priority
                sizes="(min-width: 1280px) 1216px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-blue/20 via-transparent to-transparent" />
            </div>
          ) : null}

          <div className={`${landingImage ? "mt-9 sm:mt-12" : "pt-5 sm:pt-8"} mx-auto max-w-4xl text-center`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {landing.node.level}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-dark-blue sm:text-5xl lg:text-6xl">
              {landing.content.title}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {description}
            </p>
          </div>

          {showTechnicalContent ? (
            <div className="mx-auto mt-9 max-w-4xl border-t border-border pt-8 sm:mt-12 sm:pt-10">
              <h2 className="text-center text-2xl font-black text-dark-blue">
                Información para elegir mejor
              </h2>
              <div className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground sm:text-lg">
                {landing.content.technicalContent}
              </div>
            </div>
          ) : null}
        </header>
      </article>

      {landing.children.length ? (
        <section className="border-y border-border bg-secondary/30 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Explora categorías relacionadas"
              description={`Encuentra opciones más específicas dentro de ${landing.node.name}.`}
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {landing.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/productos/${[...slug, child.slug].join("/")}`}
                  className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  {child.image ? (
                    <div className="relative aspect-[16/8] overflow-hidden bg-secondary">
                      <Image
                        src={child.image}
                        alt={child.imageAlt || child.name}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 32px)"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {child.level}
                    </p>
                    <h2 className="mt-2 text-xl font-black text-dark-blue transition-colors group-hover:text-primary">
                      {child.name}
                    </h2>
                    {child.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {child.description}
                      </p>
                    ) : null}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-dark-blue transition-colors group-hover:text-primary">
                      Ver categoría
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Productos disponibles"
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
