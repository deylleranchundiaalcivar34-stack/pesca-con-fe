import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { businessConfig } from "@/data/datos-negocio";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Teléfonos, correo, redes sociales, WhatsApp, horario y ubicación de Pesca Con Fe en Shushufindi, Ecuador.",
};

const socialLinks = [
  {
    label: "Facebook",
    href: businessConfig.social.facebook,
    icon: "/images/redes-sociales/facebook-icon.webp",
    variant: "outline" as const,
  },
  {
    label: "Instagram",
    href: businessConfig.social.instagram,
    icon: "/images/redes-sociales/instagram-icon.webp",
    variant: "outline" as const,
  },
  {
    label: "TikTok",
    href: businessConfig.social.tiktok,
    icon: "/images/redes-sociales/tiktok-icon.webp",
    variant: "outline" as const,
  },
  {
    label: "YouTube",
    href: businessConfig.social.youtube,
    icon: "/images/redes-sociales/youtube-icon.webp",
    variant: "outline" as const,
  },
  {
    label: "WhatsApp",
    href: businessConfig.social.whatsapp,
    icon: "/images/redes-sociales/whatsapp-icon.webp",
    variant: "outline" as const,
  },
] as const;

// Pagina de contacto con datos del negocio y redes.
export default function ContactPage() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-2.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Estamos listos para ayudarte a elegir tu equipo"
            description="Escríbenos por WhatsApp, visita el local o revisa nuestras redes sociales."
            className="max-w-5xl [&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del negocio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p className="flex gap-3">
                  <Phone className="size-5 text-primary" aria-hidden="true" />
                  {businessConfig.phones.join(" / ")}
                </p>
                <p className="flex gap-3">
                  <Mail className="size-5 text-primary" aria-hidden="true" />
                  {businessConfig.email}
                </p>
                <p className="flex gap-3">
                  <MapPin className="size-5 text-primary" aria-hidden="true" />
                  <span className="text-sm leading-6 text-muted-foreground">
                    <span className="block">Mega Mercado Municipal</span>
                    <span className="block">Local N° 145 - Planta Alta</span>
                    <span className="block">Shushufindi, Ecuador</span>
                  </span>
                </p>
                <div>
                  <p className="text-sm font-semibold text-dark-blue">
                    Horario del negocio
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    <span className="block">Lunes a Sábado</span>
                    <span className="block">08:30 AM - 06:00 PM</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Redes sociales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {socialLinks.map((item) => (
                  <Button
                    key={item.label}
                    asChild
                    variant={item.variant}
                    className="justify-start"
                  >
                    <a href={item.href} target="_blank" rel="noreferrer">
                      <Image
                        src={item.icon}
                        alt=""
                        width={20}
                        height={20}
                        aria-hidden="true"
                        className="size-5 object-contain"
                      />
                      {item.label}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="h-full min-h-[520px] overflow-hidden rounded-lg border border-border bg-secondary shadow-soft ring-1 ring-white/80">
            <iframe
              src={businessConfig.mapsEmbedUrl}
              width="600"
              height="450"
              className="block h-full min-h-[520px] w-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de ubicación de Pesca Con Fe"
            />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
