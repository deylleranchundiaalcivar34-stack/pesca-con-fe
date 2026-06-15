import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Hero principal de la pagina de inicio con llamada al catalogo.
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-dark-blue text-white">
      <Image
        src="/images/banners/banner-inicio.webp"
        alt="Banner promocional de Pesca Con Fe para articulos de pesca"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-dark-blue/82 via-dark-blue/58 to-dark-blue/12" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-dark-blue/45 via-transparent to-dark-blue/10" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-8rem)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Pesca Con Fe
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">
            Equipos confiables para cada jornada de pesca, en el río, el mar o
            tu próxima aventura.
          </p>
          <div className="mt-8 flex">
            <Button
              asChild
              variant="premium"
              size="lg"
              className="h-14 w-full rounded-lg px-7 text-base shadow-xl shadow-black/20 hover:-translate-y-0.5 sm:w-auto"
            >
              <Link href="/productos">
                Ver productos
                <ArrowRight className="rounded-full bg-dark-blue/10 p-0.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-white/82 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-gold-light" aria-hidden="true" />
              Calidad para pescar con confianza
            </div>
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-gold-light" aria-hidden="true" />
              Envíos a todo Ecuador
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
