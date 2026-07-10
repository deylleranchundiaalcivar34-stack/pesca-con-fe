import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Conoce la historia de Pesca Con Fe, tienda de artículos de pesca y camping nacida en Shushufindi con atención cercana, productos confiables y pasión por la pesca responsable.",
};

const milestones = [
  {
    year: "2019",
    title: "Nace Pesca Con Fe",
    description:
      "En agosto, Hugo Anchundia inicia este emprendimiento en Shushufindi, con la idea de crear una tienda especializada para los amantes de la pesca deportiva en la Amazonía ecuatoriana.",
  },
  {
    year: "2020",
    title: "El comercio digital toma fuerza",
    description:
      "Durante la pandemia, el canal en línea permitió llegar a más personas cuando conseguir implementos profesionales era difícil y costoso.",
  },
  {
    year: "2023",
    title: "Nace el Club Fe Amazónica",
    description:
      "La pasión compartida por ríos, lagunas, mar y naturaleza dio origen a una comunidad enfocada en pesca responsable y convivencia familiar.",
  },
] as const;

const values = [
  {
    icon: ShieldCheck,
    title: "Productos confiables",
    description:
      "Seleccionamos equipos de pesca deportiva y camping con enfoque en calidad, utilidad real y marcas de respaldo.",
  },
  {
    icon: HeartHandshake,
    title: "Asesoría cercana",
    description:
      "Acompañamos a pescadores aficionados, deportivos y profesionales para elegir el equipo adecuado para cada salida.",
  },
  {
    icon: Leaf,
    title: "Pesca responsable",
    description:
      "Promovemos pesca con liberación, educación ambiental y respeto por la biodiversidad amazónica.",
  },
] as const;

const galleryImages = [
  {
    src: "/images/fotos/foto-cuadrada1.webp",
    alt: "Captura de Pacu",
    label: "Captura de Pacu en los ríos del oriente ecuatoriano",
  },
  {
    src: "/images/fotos/foto-pesca10.webp",
    alt: "Captura Gandio",
    label: "Captura de pez Gandio de profundidad en altamar",
  },
  {
    src: "/images/fotos/foto-rectangulo.webp",
    alt: "Captura de pez Mero Goliat",
    label: "Captura de pez Mero Goliat en altamar",
  },
  {
    src: "/images/fotos/foto-pesca11.webp",
    alt: "Captura de pez Dorado en río amazónico",
    label: "Captura de pez Dorado en río amazónico",
  },
  {
    src: "/images/fotos/foto-pesca14.webp",
    alt: "Captura de Huayaipe",
    label: "Captura de pez Huayaipe en altamar",
  },
  {
    src: "/images/fotos/foto-pesca13.webp",
    alt: "Captura de Wahoo",
    label: "Captura de pez Wahoo en altamar",
  },
] as const;

// Pagina institucional con historia, valores y galeria.
export default function AboutPage() {
  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden bg-dark-blue text-white">
        <Image
          src="/images/fotos/pesca-marlin.webp"
          alt="Pescador en una jornada de aventura con equipo de pesca"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_center]"
        />
        <div className="absolute inset-0 bg-dark-blue/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-blue/92 via-dark-blue/56 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-dark-blue/82 to-transparent" />

        <div className="relative mx-auto flex min-h-[calc(100svh-10rem)] max-w-7xl items-end px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl pb-4">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-light">
              Quiénes somos
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight drop-shadow-[0_6px_24px_rgb(5_44_101_/_0.65)] sm:text-6xl">
              Una tienda nacida de la fe, la pesca y la Amazonía.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90 drop-shadow-[0_3px_14px_rgb(5_44_101_/_0.72)]">
              Fishing &amp; Camping Pesca Con Fe nació en Shushufindi para ofrecer
              equipos de pesca deportiva y camping de calidad a quienes viven la
              aventura en ríos, lagunas, mar y rutas  del Ecuador.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/productos">
                  Ver productos
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/35 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/contacto">Contactar tienda</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <figure>
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-secondary shadow-soft lg:aspect-[4/3]">
                <Image
                  src="/images/fotos/tienda-fisica-local-megamercado.webp"
                  alt="Local físico de Pesca Con Fe en el Mega Mercado Municipal de Shushufindi"
                  fill
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">
                Local N.º 145 y 146, segunda planta del Mega Mercado Municipal de Shushufindi.
              </figcaption>
            </figure>

            <div className="max-w-[38rem] lg:max-w-none">
              <SectionHeading
                className="max-w-[40rem]"
                title="Un emprendimiento creado para resolver una necesidad real"
                description="Fishing & Camping Pesca Con Fe nació en agosto de 2019 en Shushufindi, Sucumbíos, como el sueño de Hugo Anchundia, un amante y apasionado de la pesca deportiva, con la visión de ofrecer equipos de pesca deportiva de calidad a la Amazonía ecuatoriana."
              />
              <div className="mt-7 max-w-[39rem] space-y-5 text-base leading-7 text-muted-foreground">
                <p>
                  Antes de tener un local físico, el proyecto empezó como tienda virtual.
                  La idea nació por una necesidad: el acceso limitado a implementos
                  profesionales y semiprofesionales, con altos costos, envíos difíciles y
                  poca disponibilidad en la región.
                </p>
                <p>
                  Con años de experiencia en la pesca y amor por la naturaleza amazónica,
                  Hugo convirtió esa necesidad en un espacio de confianza para encontrar
                  productos, recibir asesoría y equiparse mejor para cada jornada.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {milestones.map((item) => (
              <div key={item.year} className="rounded-lg border border-border bg-secondary p-5">
                <div className="flex h-12 w-20 items-center justify-center rounded-md bg-dark-blue text-lg font-black text-gold-light">
                  {item.year}
                </div>
                <div>
                  <h3 className="mt-4 text-lg font-bold text-dark-blue">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-dark-blue bg-[linear-gradient(rgb(5_44_101_/_0.78),rgb(5_44_101_/_0.78)),url('/images/banners/banner-3.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
            <div className="max-w-[48rem]">
              <SectionHeading
                className="max-w-[46rem] [&_h2]:text-white [&_p]:text-white/80"
                title="Más que una tienda: una pasión compartida"
                description="Antes incluso de consolidarse como negocio, Pesca Con Fe nació como una forma de compartir experiencias de pesca en ríos y lagunas de Shushufindi y Sucumbíos."
              />
              <div className="mt-7 grid max-w-[45rem] gap-5 text-base leading-7 text-white/80">
                <p>
                  Hugo Anchundia, junto a amigos y hermanos de la iglesia, empezó a
                  documentar salidas de pesca y compartir contenido audiovisual,
                  especialmente en YouTube. De esa pasión nació el Club Fe Amazónica:
                  una comunidad conformada por familias, pescadores y amantes de la
                  naturaleza.
                </p>
                <p>
                  El club promueve pesca deportiva responsable, pesca con liberación,
                  educación ambiental, convivencia familiar y respeto por los
                  ecosistemas amazónicos.
                </p>
                <p className="rounded-r-lg border-l-4 border-gold bg-white/90 py-4 pl-5 pr-4 text-sm font-bold leading-6 text-dark-blue shadow-sm">
                  Reconocido como el primer club oficial de pesca deportiva legalmente
                  constituido en la Amazonía ecuatoriana, siendo pioneros en
                  promover la pesca deportiva responsable con liberación.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <figure className="relative aspect-[16/9] overflow-hidden rounded-lg bg-dark-blue shadow-soft">
                <Image
                  src="/images/fotos/logotipo-oficial-club-fe-amazonica.webp"
                  alt="Logotipo oficial del Club Fe Amazónica"
                  fill
                  sizes="(min-width: 1024px) 430px, 100vw"
                  className="object-cover object-center"
                />
              </figure>
              <figure className="relative aspect-[16/9] overflow-hidden rounded-lg bg-secondary shadow-soft">
                <Image
                  src="/images/fotos/foto-bagre.webp"
                  alt="Foto captura de bagre en río amazónico"
                  fill
                  sizes="(min-width: 1024px) 430px, 100vw"
                  className="object-cover object-top"
                />
              </figure>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {galleryImages.map((image) => (
              <figure
                key={image.src}
                className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-soft"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                </div>
                <figcaption className="px-4 py-3 text-sm font-bold text-dark-blue">
                  {image.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-secondary shadow-soft sm:aspect-[16/11] lg:aspect-[4/5]">
                <Image
                  src="/images/fotos/pescando-espalda.webp"
                  alt="Pescador con jersey de Pesca Con Fe mirando hacia el agua"
                  fill
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  className="object-cover object-center"
                />
              </div>
              <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">
                Una forma de vivir la pesca conectada con la naturaleza amazónica.
              </figcaption>
            </figure>

            <div>
              <SectionHeading
                className="max-w-[42rem]"
                title="Calidad, confianza y futuro sostenible"
                description="Trabajamos para que cada compra sea útil, bien asesorada y conectada con una forma más responsable de vivir la pesca."
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-secondary p-5">
                  <Sparkles className="size-8 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold text-dark-blue">Nuestra misión</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Brindar productos de pesca deportiva y camping de alta calidad,
                    accesibles y confiables, fomentando al mismo tiempo una cultura
                    de pesca responsable, deportiva y amigable con el medio ambiente.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary p-5">
                  <UsersRound className="size-8 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold text-dark-blue">Nuestra visión</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Ser una de las tiendas referentes en pesca deportiva y camping
                    en la Amazonía ecuatoriana y a nivel nacional, reconocida por la
                    calidad de sus productos, el compromiso con sus clientes y la
                    promoción de prácticas sostenibles en la pesca.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {values.map((item) => (
                  <div key={item.title} className="rounded-lg border border-border bg-white p-4 shadow-soft">
                    <item.icon className="size-7 text-primary" aria-hidden="true" />
                    <h3 className="mt-4 text-base font-bold text-dark-blue">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </PublicShell>
  );
}
