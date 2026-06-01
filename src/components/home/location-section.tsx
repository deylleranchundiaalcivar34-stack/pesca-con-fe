import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { businessConfig } from "@/data/mock-business";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";

export function LocationSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionHeading
            title="Visítanos en Shushufindi"
            description="Estamos en el Mega Mercado Municipal, Local N° 145 - Planta Alta."
          />
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <span>{businessConfig.location}</span>
            </p>
            <p className="flex gap-3">
              <Clock className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <span>{businessConfig.schedule}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <span>{businessConfig.phones.join(" / ")}</span>
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton label="Escribir por WhatsApp" />
            <Button asChild variant="outline">
              <Link href="/contacto">Ver contacto</Link>
            </Button>
          </div>
        </div>

        <div className="h-[360px] overflow-hidden rounded-lg border border-border bg-secondary shadow-soft ring-1 ring-white/80">
          <iframe
            src={businessConfig.mapsEmbedUrl}
            width="600"
            height="450"
            className="block h-full w-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de ubicación de Pesca Con Fe en Shushufindi"
          />
        </div>
      </div>
    </section>
  );
}
