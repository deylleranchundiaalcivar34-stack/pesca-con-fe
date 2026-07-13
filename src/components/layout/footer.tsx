import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { businessConfig } from "@/data/datos-negocio";

const informationLinks = [
  { label: "Qui\u00e9nes somos", href: "/quienes-somos" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
  { label: "Contacto", href: "/contacto" },
] as const;

const categoryLinks = [
  { label: "Art\u00edculos de pesca", href: "/productos" },
  { label: "Indumentaria", href: "/productos/indumentaria" },
  { label: "Equipamiento", href: "/productos/equipamiento" },
] as const;

const socialLinks = [
  { label: "Facebook", href: businessConfig.social.facebook, icon: "/images/redes-sociales/facebook-icon.webp" },
  { label: "Instagram", href: businessConfig.social.instagram, icon: "/images/redes-sociales/instagram-icon.webp" },
  { label: "TikTok", href: businessConfig.social.tiktok, icon: "/images/redes-sociales/tiktok-icon.webp" },
  { label: "YouTube", href: businessConfig.social.youtube, icon: "/images/redes-sociales/youtube-icon.webp" },
] as const;

const footerLinkClassName =
  "inline-flex text-sm leading-6 text-white/75 transition hover:text-gold-light focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light";

// Footer público con una grilla amplia para conservar la identidad de marca en una sola línea.
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-blue text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-x-8 gap-y-10 px-4 py-12 sm:grid-cols-2 sm:px-6 xl:grid-cols-[1.35fr_.75fr_.85fr_1.55fr_1fr] xl:gap-x-9 xl:px-8 xl:py-14">
        <div className="sm:col-span-2 xl:col-span-1">
          <Link
            href="/"
            className="inline-flex flex-nowrap items-center gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
            aria-label="Inicio - Pesca Con Fe"
          >
            <Image
              src="/images/logos/logo-negro-nuevo2.webp"
              alt="Pesca Con Fe"
              width={909}
              height={827}
              className="h-auto w-24 shrink-0 sm:w-28"
            />
            <span className="whitespace-nowrap text-xl font-black text-white xl:text-2xl">Pesca Con Fe</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Tienda especializada en pesca deportiva, camping y aventura en la Amazon\u00eda ecuatoriana.
          </p>
        </div>

        <FooterColumn title={"Informaci\u00f3n"}>
          <ul className="space-y-2.5">
            {informationLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={footerLinkClassName}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn title={"Categor\u00edas"}>
          <ul className="space-y-2.5">
            {categoryLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={footerLinkClassName}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn title={"Atenci\u00f3n al cliente"}>
          <ul className="space-y-3 text-sm leading-6 text-white/75">
            <li>
              <a href={businessConfig.social.whatsapp} target="_blank" rel="noreferrer" className={`${footerLinkClassName} items-start gap-2`}>
                <MessageCircle className="mt-1 size-4 shrink-0 text-gold-light" aria-hidden="true" />
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`tel:+${businessConfig.whatsappPhoneE164}`} className={`${footerLinkClassName} items-start gap-2`}>
                <Phone className="mt-1 size-4 shrink-0 text-gold-light" aria-hidden="true" />
                {businessConfig.phones.join(" / ")}
              </a>
            </li>
            <li>
              <a href={`mailto:${businessConfig.email}`} className={`${footerLinkClassName} items-start gap-2`}>
                <Mail className="mt-1 size-4 shrink-0 text-gold-light" aria-hidden="true" />
                {businessConfig.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-1 size-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>Mega Mercado Municipal, Local N\u00b0 145 y 146, Planta Alta, Shushufindi</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock3 className="mt-1 size-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>{businessConfig.schedule}</span>
            </li>
          </ul>
        </FooterColumn>

        <FooterColumn title={"S\u00edguenos"}>
          <div className="flex flex-nowrap gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/5 transition hover:border-gold-light/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
                aria-label={`Visitar ${item.label} de Pesca Con Fe`}
              >
                <Image src={item.icon} alt="" width={20} height={20} aria-hidden="true" className="size-5 object-contain" />
              </a>
            ))}
          </div>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-sm leading-6 text-white/65">
        <p>&copy; {new Date().getFullYear()} Store Fishing &amp; Camping - Pesca Con Fe.</p>
        <p>Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-gold-light">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
