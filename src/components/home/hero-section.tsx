import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-dark-blue text-white">
      <Image
        src="/images/hero-pescaconfe.png"
        alt="Pescador en una jornada de aventura con equipo de pesca"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-blue via-dark-blue/82 to-dark-blue/28" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-dark-blue/70 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100svh-8rem)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge className="mb-5 border-transparent bg-gold text-dark-blue">
            Pesca Con Fe · Shushufindi
          </Badge>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Pesca Con Fe
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">
            Confianza, pasión y aventura con equipos de pesca seleccionados
            para cada salida al río, al mar o a tu próxima ruta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/productos">
                Ver productos
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <WhatsAppButton />
          </div>
          <div className="mt-8 grid gap-3 text-sm text-white/82 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-gold-light" aria-hidden="true" />
              Calidad, confianza y pasión por la pesca
            </div>
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-gold-light" aria-hidden="true" />
              Envíos a todo Ecuador mediante Servientrega
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
