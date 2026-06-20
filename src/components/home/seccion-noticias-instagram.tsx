import Script from "next/script";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

const elfsightAppClass = "elfsight-app-e2ead818-0c3f-41bb-a2ee-32fe52a21a53";

// Integra el widget externo de Instagram y noticias.
export function InstagramNewsSection() {
  return (
    <section className="bg-dark-blue bg-[linear-gradient(rgb(5_44_101_/_0.78),rgb(5_44_101_/_0.78)),url('/images/banners/banner-3.webp')] bg-cover bg-center py-16 sm:py-20">
      <Script
        id="elfsight-instagram-feed"
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
      <style>{`
        .${elfsightAppClass} .eapps-instagram-feed-posts-grid-load-more-container,
        .${elfsightAppClass} .eapps-instagram-feed-posts-grid-load-more {
          display: none !important;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SectionHeading
            title="Novedades"
            description="Productos, capturas y experiencias que compartimos con la comunidad de Pesca Con Fe."
            className="[&_h2]:text-white [&_p]:text-white/80"
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <div className="min-h-[420px] p-3 sm:min-h-[480px] sm:p-4">
            <div className={elfsightAppClass} data-elfsight-app-lazy="" />
          </div>
        </div>
      </div>
    </section>
  );
}
