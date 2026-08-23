import { Compass, Fish, ShieldCheck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Equipos de calidad",
    text: "Cañas, carretes y accesorios elegidos por su resistencia, desempeño y utilidad en jornadas de pesca.",
  },
  {
    icon: Sparkles,
    title: "Señuelos bien elegidos",
    text: "Modelos, colores y acciones pensados para distintas técnicas, especies y condiciones de pesca.",
  },
  {
    icon: Fish,
    title: "Asesoría cercana",
    text: "Te orientamos con criterio para elegir según tu experiencia, presupuesto y tipo de salida.",
  },
  {
    icon: Compass,
    title: "Listos para la aventura",
    text: "Artículos prácticos para pescar con más comodidad, preparación y confianza en cada jornada.",
  },
];

// Resume beneficios comerciales de comprar en Pesca Con Fe.
export function BenefitsSection() {
  return (
    <section className="home-deferred-section bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Pesca con confianza y preparación"
          description="Productos confiables, atención cercana y opciones pensadas para quienes disfrutan cada salida con pasión."
          align="center"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-lg border border-border bg-white p-5 shadow-sm"
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
