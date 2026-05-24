import Image from "next/image";
import { brandLogos } from "@/data/mock-business";
import { cn } from "@/lib/utils";

export function BrandStrip() {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Marcas disponibles en tienda
        </p>
        <h2 className="mt-3 text-3xl font-bold text-dark-blue sm:text-4xl">
          Equipos y accesorios de fabricantes reconocidos
        </h2>
        <p className="mt-3 text-muted-foreground">
          Seleccionamos marcas confiables para pesca deportiva, r&iacute;o, mar e indumentaria.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {brandLogos.map((brand) => (
          <div
            key={brand.name}
            className="group flex h-28 items-center justify-center rounded-lg border border-border bg-white px-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-soft"
          >
            <Image
              src={brand.image}
              alt={`Logo de ${brand.name}`}
              width={brand.width}
              height={brand.height}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={cn(
                "max-h-16 w-auto max-w-full object-contain transition duration-300 group-hover:scale-105",
                "logoClassName" in brand ? brand.logoClassName : undefined,
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
