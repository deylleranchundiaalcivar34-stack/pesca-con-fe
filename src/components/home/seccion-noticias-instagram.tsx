import Script from "next/script";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

const elfsightAppClass = "elfsight-app-f21e7139-6110-4bda-8eab-16682a1f05f5";

// Integra el widget externo de Instagram y noticias.
export function InstagramNewsSection() {
  return (
    <section className="bg-secondary py-16 sm:py-20">
      <Script
        id="elfsight-instagram-feed"
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SectionHeading
            title="Novedades"
            description="Productos, capturas y experiencias que compartimos con la comunidad de Pesca Con Fe."
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
