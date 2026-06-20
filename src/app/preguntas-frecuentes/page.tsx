import type { Metadata } from "next";
import { ChevronDown, CircleHelp } from "lucide-react";
import { CustomerQuestionForm } from "@/components/faq/formulario-pregunta";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { frequentlyAskedQuestions } from "@/data/preguntas-frecuentes";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resuelve dudas sobre pedidos, pagos, envíos, retiro en local, stock y seguimiento en Pesca Con Fe.",
};

// Página pública de ayuda con contenido local y consultas por WhatsApp.
export default function FrequentlyAskedQuestionsPage() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-1.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Preguntas frecuentes"
            description="Encuentra respuestas rápidas sobre cómo comprar, pagar y recibir tus productos."
            className="[&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>

      <section className="bg-secondary/55 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <CircleHelp className="size-7 text-primary" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-dark-blue">Respuestas para comprar con confianza</h1>
            </div>

            <div className="space-y-3">
              {frequentlyAskedQuestions.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-lg border border-border bg-white shadow-sm open:border-primary/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-dark-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown
                      className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="border-t border-border px-5 py-4 text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <CustomerQuestionForm />
        </div>
      </section>
    </PublicShell>
  );
}
