import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { businessConfig } from "@/data/mock-business";
import { Button } from "@/components/ui/button";

const socialLinks = [
  {
    label: "Facebook",
    href: businessConfig.social.facebook,
    icon: "/images/redes-sociales/facebook-icon.webp",
  },
  {
    label: "Instagram",
    href: businessConfig.social.instagram,
    icon: "/images/redes-sociales/instagram-icon.webp",
  },
  {
    label: "TikTok",
    href: businessConfig.social.tiktok,
    icon: "/images/redes-sociales/tiktok-icon.webp",
  },
  {
    label: "YouTube",
    href: businessConfig.social.youtube,
    icon: "/images/redes-sociales/youtube-icon.webp",
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-dark-blue text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link
            href="/"
            className="flex max-w-sm items-center gap-4"
            aria-label="Inicio - Pesca Con Fe"
          >
            <Image
              src="/images/logos/logo-negro.webp"
              alt="Pesca Con Fe"
              width={949}
              height={940}
              className="h-auto w-32 shrink-0"
            />
            <span className="text-2xl font-bold text-white">Pesca Con Fe</span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
            Equipos de pesca seleccionados para cada aventura. Compra facil,
            paga por transferencia y confirma por WhatsApp.
          </p>
        </div>

        <div>
          <p className="font-semibold text-gold-light">Contacto</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 text-gold-light" aria-hidden="true" />
              <span>{businessConfig.phones.join(" / ")}</span>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 text-gold-light" aria-hidden="true" />
              <span>{businessConfig.email}</span>
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 text-gold-light" aria-hidden="true" />
              <span className="text-sm leading-6 text-white/75">
                <span className="block">Mega Mercado Municipal</span>
                <span className="block">Local N&deg; 145 - Planta Alta</span>
                <span className="block">Shushufindi, Ecuador</span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-gold-light">Siguenos</p>
          <div className="mt-4 flex gap-2">
            {socialLinks.map((item) => (
              <Button
                key={item.label}
                asChild
                size="icon"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10"
                aria-label={item.label}
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
                </a>
              </Button>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-gold-light">Horario del negocio</p>
            <p className="mt-2 text-sm leading-7 text-white/70">
              <span className="block">Lunes a S&aacute;bado</span>
              <span className="block">08:30 AM - 06:00 PM</span>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-sm leading-7 text-white/75">
        <p>&copy; {new Date().getFullYear()} Store Fishing &amp; Camping - Pesca Con Fe.</p>
        <p>Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
