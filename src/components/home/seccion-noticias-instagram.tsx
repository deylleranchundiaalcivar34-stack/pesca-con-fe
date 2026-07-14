import Script from "next/script";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

const elfsightAppClass = "elfsight-app-e2ead818-0c3f-41bb-a2ee-32fe52a21a53";

const featuredPlaylists = [
  {
    image: "/images/categorias/pesca_rios.webp",
    alt: "Cañas de pesca frente al mar",
    href: "https://www.youtube.com/playlist?list=PLXQi65Q0L6DwxkF-9vvzMwC235KVCAdNF",
    label: "Ver playlist de cañas",
  },
  {
    image: "/images/categorias/pesca_altamar.webp",
    alt: "Carretes de pesca frente al mar",
    href: "https://www.youtube.com/playlist?list=PLXQi65Q0L6DwPis4k7F0GKPys9f9Q_OfP",
    label: "Ver playlist de carretes",
  },
  {
    image: "/images/categorias/visita_facebook.webp",
    alt: "Señuelos de pesca frente al mar",
    href: "https://www.facebook.com/pescaconfe1",
    label: "Ver playlist de señuelos",
  },
] as const;

// Integra el widget externo de Instagram y noticias.
export function InstagramNewsSection() {
  return (
    <section className="bg-dark-blue bg-[linear-gradient(rgb(5_44_101_/_0.78),rgb(5_44_101_/_0.78)),url('/images/banners/banner-3.webp')] bg-cover bg-center py-16 sm:py-20">
      <Script
        id="elfsight-instagram-feed"
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
      <style>{`
        .${elfsightAppClass} .eapps-instagram-feed-posts-grid-load-more-container,
        .${elfsightAppClass} .eapps-instagram-feed-posts-grid-load-more {
          display: none !important;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SectionHeading
            title="Novedades"
            description="Productos, capturas y experiencias que compartimos con la comunidad de Pesca Con Fe."
            className="[&_h2]:text-white [&_p]:text-white/80"
          />
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2 sm:mb-10 sm:gap-5">
          {featuredPlaylists.map((playlist) => (
            <a
              key={playlist.href}
              href={playlist.href}
              target="_blank"
              rel="noreferrer"
              aria-label={playlist.label}
              className="group relative block aspect-[14/9] overflow-hidden rounded-lg border border-white/35 shadow-lg shadow-dark-blue/25 transition duration-300 hover:-translate-y-1 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-blue"
            >
              <Image
                src={playlist.image}
                alt={playlist.alt}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 1280px) 30vw, 22rem"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-dark-blue opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:right-3 sm:top-3 sm:size-9">
                <ExternalLink className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <div className="min-h-[420px] p-3 sm:min-h-[480px] sm:p-4">
            <div className={elfsightAppClass} data-elfsight-app-lazy="" />
          </div>
        </div>
      </div>
    </section>
  );
}
