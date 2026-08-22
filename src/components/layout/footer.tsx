import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiDinersclub, SiDiscover, SiMastercard, SiVisa } from "react-icons/si";
import { businessConfig } from "@/data/datos-negocio";

const informationLinks = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
  { label: "Contacto", href: "/contacto" },
] as const;

const categoryLinks = [
  { label: "Artículos de pesca", href: "/productos" },
  { label: "Indumentaria", href: "/productos/indumentaria" },
  { label: "Camping", href: "/productos/camping" },
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
              alt=""
              aria-hidden="true"
              width={909}
              height={827}
              sizes="(min-width: 640px) 112px, 96px"
              className="h-auto w-24 shrink-0 sm:w-28"
            />
            <span className="whitespace-nowrap text-xl font-black text-white xl:text-2xl">Pesca Con Fe</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Tienda especializada en pesca deportiva, camping y aventura en la {"Amazonía"} ecuatoriana.
          </p>
        </div>

        <FooterColumn title={"Información"}>
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

        <FooterColumn title={"Categorías"}>
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

        <FooterColumn title={"Atención al cliente"}>
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
              <span>Mega Mercado Municipal, Local N° 145 y 146, Planta Alta, Shushufindi</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock3 className="mt-1 size-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>{businessConfig.schedule}</span>
            </li>
          </ul>
        </FooterColumn>

        <FooterColumn title={"Síguenos"}>
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

          <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-gold-light">
              Métodos de pago
            </h3>
            <ul
              className="mt-2 flex flex-wrap gap-1"
              aria-label="Métodos de pago aceptados"
            >
              <PaymentMethod label="Visa" hoverColor="group-hover:text-[#1434CB]" className="size-[30px]">
                <SiVisa className="size-[18px]" aria-hidden="true" />
              </PaymentMethod>
              <PaymentMethod label="Mastercard" hoverColor="group-hover:text-[#EB001B]" className="size-[30px]">
                <SiMastercard className="size-[18px]" aria-hidden="true" />
              </PaymentMethod>
              <PaymentMethod label="Diners Club" hoverColor="group-hover:text-[#0079BE]" className="size-[30px]">
                <SiDinersclub className="size-[18px]" aria-hidden="true" />
              </PaymentMethod>
              <PaymentMethod label="Discover" hoverColor="group-hover:text-[#FF6000]" className="size-[30px]">
                <SiDiscover className="size-[18px]" aria-hidden="true" />
              </PaymentMethod>
              <PaymentMethod label="PayPhone" className="size-[30px]">
                <Image
                  src="/images/metodos-de-pago/payphone-icon.svg"
                  alt=""
                  width={62}
                  height={36}
                  aria-hidden="true"
                  className="h-auto w-5 opacity-65 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0 motion-reduce:transition-none"
                />
              </PaymentMethod>
            </ul>
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

function PaymentMethod({
  label,
  children,
  hoverColor = "",
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hoverColor?: string;
  className?: string;
}) {
  return (
    <li
      title={label}
      className={`group flex shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.05] text-white/55 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gold-light/60 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.14)] motion-reduce:transform-none motion-reduce:transition-none ${hoverColor} ${className}`}
    >
      <span className="sr-only">{label}</span>
      {children}
    </li>
  );
}
