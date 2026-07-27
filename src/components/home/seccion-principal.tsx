"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import infoPesca from "../../../public/images/banners/info_pesca.webp";
import infoPescaPortada from "../../../public/images/banners/info_pesca_portada.webp";

const HERO_SLIDES = [
  {
    id: "info-pesca-portada",
    src: infoPescaPortada,
    alt: "Información de Pesca Con Fe",
    imageClassName: "object-contain object-center lg:object-cover",
  },
  {
    id: "canas",
    src: "/images/banners/banner_canas1.webp",
    alt: "Pescador realizando pesca deportiva desde una lancha",
    href: "/productos?categoria=canas",
    imageClassName: "object-contain object-center lg:object-cover",
  },
  {
    id: "carretes",
    src: "/images/banners/banner_carretes1.webp",
    alt: "Selección de cañas, carretes y señuelos para pesca",
    href: "/productos?categoria=carretes",
    imageClassName: "object-contain object-center lg:object-cover",
  },
  {
    id: "senuelos",
    src: "/images/banners/banner_senuelos.webp",
    alt: "Equipamiento de pesca disponible en Pesca Con Fe",
    href: "/productos?categoria=senuelos",
    imageClassName: "object-contain object-center lg:object-cover lg:object-left",
  },
  {
    id: "info-pesca",
    src: infoPesca,
    alt: "Información de pesca",
    imageClassName: "object-contain object-center lg:object-cover",
  },
] as const;

const AUTO_ADVANCE_DELAY = 6500;

/** Hero principal con los banners promocionales de la tienda. */
export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length);
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  const showSlide = (index: number) => {
    setActiveSlide(index);
    setIsPaused(true);
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-dark-blue text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[clamp(10rem,35vw,42rem)] overflow-hidden bg-black">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            aria-hidden={index === activeSlide ? undefined : "true"}
            className={`absolute inset-0 block transition-[opacity,transform] duration-1000 ease-out motion-reduce:transition-none ${
              index === activeSlide
                ? "z-10 scale-100 opacity-100"
                : "pointer-events-none scale-105 opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={index === activeSlide ? slide.alt : ""}
              fill
              preload={index === 0}
              loading={index === 1 ? "eager" : undefined}
              sizes="100vw"
              className={slide.imageClassName}
            />
            {"href" in slide ? (
              <Link
                href={slide.href}
                aria-label={`Ver productos de ${slide.alt}`}
                tabIndex={index === activeSlide ? undefined : -1}
                className="absolute inset-0 z-20 focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="relative z-30 flex justify-center bg-dark-blue px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-1 rounded-full border border-white/80 bg-white/90 px-1.5 py-1 shadow-lg shadow-black/15 backdrop-blur-md sm:gap-3 sm:px-2 sm:py-2">
          <button
            type="button"
            aria-label="Mostrar banner anterior"
            onClick={() => showSlide((activeSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="grid size-8 place-items-center rounded-full text-dark-blue transition hover:bg-dark-blue hover:text-white sm:size-9"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-0.5" role="group" aria-label="Seleccionar banner">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Mostrar banner ${index + 1}`}
                aria-current={index === activeSlide ? "true" : undefined}
                onClick={() => showSlide(index)}
                className="grid size-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-blue"
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 rounded-full transition-all motion-reduce:transition-none ${
                    index === activeSlide ? "w-4 bg-dark-blue" : "w-2.5 bg-dark-blue/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Mostrar siguiente banner"
            onClick={() => showSlide((activeSlide + 1) % HERO_SLIDES.length)}
            className="grid size-8 place-items-center rounded-full text-dark-blue transition hover:bg-dark-blue hover:text-white sm:size-9"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
