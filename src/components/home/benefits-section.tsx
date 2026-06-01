import { Compass, Fish, ShieldCheck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Equipos de calidad",
    text: "Cañas, carretes y accesorios pensados para uso real en río, costa y viajes largos.",
  },
  {
    icon: Sparkles,
    title: "Señuelos seleccionados",
    text: "Opciones para río, mar y jigs con colores y acciones que ayudan a provocar ataques.",
  },
  {
    icon: Fish,
    title: "Pasión por la pesca",
    text: "Atención cercana para ayudarte a elegir según especie, técnica y presupuesto.",
  },
  {
    icon: Compass,
    title: "Aventura sin fronteras",
    text: "Envíos a todo Ecuador mediante Servientrega y coordinación directa por WhatsApp.",
  },
];

export function BenefitsSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Calidad, confianza y pasión por la pesca"
          description="Una experiencia simple para comprar artículos de pesca con soporte humano y pago por transferencia."
          align="center"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-lg border border-border bg-secondary p-5"
            >
              <benefit.icon className="size-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-dark-blue">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
