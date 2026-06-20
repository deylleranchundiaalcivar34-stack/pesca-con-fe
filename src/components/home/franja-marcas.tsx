import Image from "next/image";
import { brandLogos } from "@/data/datos-negocio";
import { cn } from "@/lib/utilidades";

// Presenta las marcas principales en una franja horizontal.
export function BrandStrip() {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Marcas líderes para pescadores exigentes
        </h2>
        <p className="mt-3 text-white/80">
          Equipos y accesorios de fabricantes confiables para quienes buscan
          rendimiento en cada salida.
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
