import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { brandLogos, businessConfig } from "@/data/mock-business";

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
      "El Tecnólogo Hugo Anchundia inicia el emprendimiento en Shushufindi para acercar equipos de pesca deportiva de calidad a la Amazonía ecuatoriana.",
  },
  {
    year: "2020",
    title: "La tienda virtual toma fuerza",
    description:
      "El comercio digital permitió llegar a más pescadores cuando el acceso a implementos profesionales y semiprofesionales era limitado en la región.",
  },
  {
    year: "2023",
    title: "Crece la comunidad",
    description:
      "La pasión compartida por ríos, lagunas y naturaleza dio origen al Club Fe Amazónica, enfocado en pesca responsable y convivencia familiar.",
  },
] as const;

const values = [
  {
    icon: ShieldCheck,
    title: "Productos confiables",
    description:
      "Seleccionamos cañas, carretes, señuelos, indumentaria y equipos de camping con enfoque en calidad y utilidad real.",
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
      "Promovemos prácticas sostenibles, respeto por la biodiversidad y cuidado de los ecosistemas amazónicos.",
  },
] as const;

const galleryImages = [
  {
    src: "/images/hero-pescaconfe.png",
    alt: "Jornada de pesca deportiva en la naturaleza",
    label: "Pasión por la pesca",
  },
  {
    src: "/images/categorias/canas.webp",
    alt: "Cañas de pesca disponibles en Pesca Con Fe",
    label: "Equipos seleccionados",
  },
  {
    src: "/images/categorias/carretes.webp",
    alt: "Carretes de pesca disponibles en Pesca Con Fe",
    label: "Marcas confiables",
  },
] as const;

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden bg-dark-blue text-white">
        <Image
          src="/images/hero-pescaconfe.png"
          alt="Pescador en una jornada de aventura con equipo de pesca"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-blue via-dark-blue/86 to-dark-blue/35" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-dark-blue/75 to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100svh-10rem)] max-w-7xl items-end gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div className="max-w-3xl pb-4">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-light">
              Quiénes somos
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
              Una tienda nacida de la fe, la pesca y la Amazonía.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
              Fishing &amp; Camping Pesca Con Fe nació en Shushufindi para acercar
              equipos de pesca deportiva y camping de calidad a quienes viven la
              aventura en ríos, lagunas y rutas del Ecuador.
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

          <div className="grid gap-3 rounded-lg border border-white/15 bg-white/10 p-4 shadow-soft backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <Store className="size-5 text-gold-light" aria-hidden="true" />
              <p className="text-sm font-semibold text-white">Tienda física y atención personalizada</p>
            </div>
            <div className="flex gap-3 text-sm leading-6 text-white/78">
              <MapPin className="mt-0.5 size-5 shrink-0 text-gold-light" aria-hidden="true" />
              <span>
                Mega Mercado Municipal, segunda planta, local N.º 145,
                Shushufindi, Sucumbíos.
              </span>
            </div>
            <div className="flex gap-3 text-sm leading-6 text-white/78">
              <CalendarDays className="mt-0.5 size-5 shrink-0 text-gold-light" aria-hidden="true" />
              <span>{businessConfig.schedule}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionHeading
              eyebrow="Nuestra historia"
              title="Un emprendimiento creado para resolver una necesidad real"
              description="Antes de tener un local físico, Pesca Con Fe empezó como tienda virtual. La meta era clara: que los pescadores de la Amazonía pudieran acceder a implementos confiables sin depender de envíos difíciles, poca disponibilidad o costos elevados."
            />
            <p className="mt-6 text-base leading-8 text-muted-foreground">
              Con años de experiencia en la pesca deportiva, Hugo Anchundia convirtió
              esa necesidad en un espacio de confianza para encontrar productos,
              recibir asesoría y equiparse mejor para cada jornada.
            </p>
          </div>

          <div className="grid gap-4">
            {milestones.map((item) => (
              <div key={item.year} className="grid gap-4 rounded-lg border border-border bg-secondary p-5 sm:grid-cols-[90px_1fr]">
                <div className="flex h-12 w-20 items-center justify-center rounded-md bg-dark-blue text-lg font-black text-gold-light">
                  {item.year}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark-blue">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="grid gap-4 sm:grid-cols-3">
              {galleryImages.map((image, index) => (
                <figure
                  key={image.src}
                  className={index === 0 ? "sm:col-span-2 sm:row-span-2" : undefined}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white bg-white shadow-soft sm:h-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes={index === 0 ? "(min-width: 1024px) 45vw, 100vw" : "(min-width: 1024px) 22vw, 50vw"}
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                    <figcaption className="absolute inset-x-3 bottom-3 rounded-md bg-dark-blue/88 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
                      {image.label}
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>

            <div>
              <SectionHeading
                eyebrow="Comunidad"
                title="Más que una tienda: una pasión compartida"
                description="Pesca Con Fe también creció como una iniciativa para documentar experiencias de pesca en Shushufindi y Sucumbíos, compartiendo contenido en plataformas digitales y conectando a familias amantes de la naturaleza."
              />
              <p className="mt-6 text-base leading-8 text-muted-foreground">
                De esa pasión nació el Club Fe Amazónica, una comunidad que promueve
                pesca deportiva responsable, pesca con liberación, educación
                ambiental y respeto por la biodiversidad amazónica.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Misión y visión"
            title="Calidad, confianza y futuro sostenible"
            description="Trabajamos para que cada compra sea útil, bien asesorada y conectada con una forma más responsable de vivir la pesca."
            align="center"
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Card className="border-primary/15 bg-secondary">
              <CardContent className="p-6">
                <Sparkles className="size-8 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-2xl font-bold text-dark-blue">Nuestra misión</h3>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Brindar productos de pesca deportiva y camping de alta calidad,
                  accesibles y confiables, fomentando una cultura de pesca
                  responsable, deportiva y amigable con el medio ambiente.
                </p>
              </CardContent>
            </Card>
            <Card className="border-gold/50 bg-white">
              <CardContent className="p-6">
                <UsersRound className="size-8 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-2xl font-bold text-dark-blue">Nuestra visión</h3>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Ser una tienda referente en pesca deportiva y camping en la
                  Amazonía ecuatoriana y a nivel nacional, reconocida por la calidad
                  de sus productos, el compromiso con sus clientes y la promoción de
                  prácticas sostenibles.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {values.map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <item.icon className="size-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-dark-blue">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-dark-blue py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-light">
                Marcas y confianza
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Equipos para pescar mejor, con respaldo cercano.
              </h2>
              <p className="mt-4 leading-8 text-white/78">
                Incorporamos marcas reconocidas internacionalmente y mantenemos una
                atención local para ayudarte a elegir según tu estilo de pesca,
                presupuesto y destino.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/productos">Explorar catálogo</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/35 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/contacto">Ver ubicación</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {brandLogos.slice(0, 8).map((brand) => (
                <div
                  key={brand.name}
                  className="flex aspect-[4/3] items-center justify-center rounded-lg border border-white/10 bg-white p-4"
                >
                  <Image
                    src={brand.image}
                    alt={brand.name}
                    width={brand.width}
                    height={brand.height}
                    className="max-h-14 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
