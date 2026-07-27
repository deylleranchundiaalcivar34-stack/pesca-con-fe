import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

const elfsightWidgetUrl = process.env.INSTAGRAM_FEED_URL?.trim();
const instagramProfileUrl = "https://www.instagram.com/pesca_con_fe";

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

const instagramGallery = [
  {
    image: "/images/fotos/foto-cuadrada1.webp",
    alt: "Pesca deportiva compartida por Pesca Con Fe",
  },
  {
    image: "/images/fotos/foto-bagre.webp",
    alt: "Captura de pesca compartida por Pesca Con Fe",
  },
  {
    image: "/images/fotos/foto-pesca10.webp",
    alt: "Jornada de pesca de la comunidad Pesca Con Fe",
  },
  {
    image: "/images/fotos/foto-pesca14.webp",
    alt: "Experiencia de pesca compartida por Pesca Con Fe",
  },
] as const;

// Integra el widget externo de Instagram y noticias.
export function InstagramNewsSection() {
  return (
    <section className="bg-dark-blue bg-[linear-gradient(rgb(5_44_101_/_0.78),rgb(5_44_101_/_0.78)),url('/images/banners/banner-3.webp')] bg-cover bg-center py-16 sm:py-20">
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

        {elfsightWidgetUrl ? (
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
            <iframe
              title="Novedades de Instagram de Pesca Con Fe"
              src={elfsightWidgetUrl}
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="origin"
              loading="lazy"
              className="h-[440px] w-full border-0 sm:h-[500px]"
            />
          </div>
        ) : (
          <a
            href={instagramProfileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Ver novedades de Pesca Con Fe en Instagram"
            className="group relative block min-h-[380px] overflow-hidden rounded-xl border border-white/35 bg-dark-blue shadow-xl shadow-dark-blue/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-blue sm:min-h-[440px]"
          >
            <span className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4">
              {instagramGallery.map((photo) => (
                <span key={photo.image} className="relative min-h-48 overflow-hidden">
                  <Image
                    src={photo.image}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </span>
              ))}
            </span>
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgb(5_44_101_/_0.9),rgb(5_44_101_/_0.58),rgb(5_44_101_/_0.24))]" />
            <span className="absolute inset-0 flex max-w-xl flex-col justify-center p-6 text-white sm:p-10 lg:p-12">
              <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-[linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)] shadow-lg sm:size-16">
                <Image
                  src="/images/redes-sociales/instagram-icon.webp"
                  alt=""
                  width={32}
                  height={32}
                  className="size-7 rounded-lg object-contain sm:size-8"
                />
              </span>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-gold">
                @pesca_con_fe
              </span>
              <span className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Capturas, productos y jornadas de nuestra comunidad
              </span>
              <span className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base">
                Visita nuestro perfil para descubrir las publicaciones y novedades más recientes.
              </span>
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-dark-blue shadow-lg transition group-hover:-translate-y-0.5 group-hover:bg-gold">
                Ver novedades en Instagram
                <ExternalLink className="size-4" aria-hidden="true" />
              </span>
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
