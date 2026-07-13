"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

type FixedMenuItem = { label: string; href: string; children?: FixedMenuItem[] };
type FixedMenuSection = { label: string; href: string; items: FixedMenuItem[] };

const fishingSections: FixedMenuSection[] = [
  { label: "Combos", href: "/productos/combos", items: [
    { label: "Combo Spinning", href: "/productos/combos/combo-spinning" },
    { label: "Combo Casting", href: "/productos/combos/combo-casting" },
    { label: "Combo Trolling / Convencional", href: "/productos/combos/combo-trolling-convencional" },
  ] },
  { label: "Cañas", href: "/productos/canas", items: [
    { label: "Spinning", href: "/productos/canas/spinning" },
    { label: "Casting", href: "/productos/canas/casting" },
    { label: "Trolling / Convencional", href: "/productos/canas/trolling-convencional" },
  ] },
  { label: "Carretes", href: "/productos/carretes", items: [
    { label: "Spinning", href: "/productos/carretes/spinning" },
    { label: "Casting", href: "/productos/carretes/casting" },
    { label: "Trolling / Convencional", href: "/productos/carretes/trolling-convencional" },
  ] },
  { label: "Señuelos", href: "/productos/senuelos", items: [
    { label: "Para río", href: "/productos/senuelos/para-rio" },
    { label: "Para mar", href: "/productos/senuelos/para-mar" },
    { label: "Spinning", href: "/productos/senuelos/spinning" },
    { label: "Casting", href: "/productos/senuelos/casting" },
    { label: "Jigging", href: "/productos/senuelos/jigging" },
    { label: "Trolling", href: "/productos/senuelos/trolling" },
    { label: "Accesorios para señuelos", href: "/productos/senuelos/accesorios-para-senuelos", children: [
      { label: "Asistentes", href: "/productos/senuelos/accesorios-para-senuelos/asistentes" },
      { label: "Faldas", href: "/productos/senuelos/accesorios-para-senuelos/faldas" },
      { label: "Anillas / Split Rings", href: "/productos/senuelos/accesorios-para-senuelos/anillas-split-rings" },
    ] },
  ] },
  { label: "Líneas y Aparejos", href: "/productos/lineas-y-aparejos", items: [
    { label: "Braid", href: "/productos/lineas-y-aparejos/braid" },
    { label: "Monofilamento", href: "/productos/lineas-y-aparejos/monofilamento" },
    { label: "Leaders", href: "/productos/lineas-y-aparejos/leaders" },
    { label: "Anzuelos", href: "/productos/lineas-y-aparejos/anzuelos" },
    { label: "Plomos", href: "/productos/lineas-y-aparejos/plomos" },
    { label: "Destorcedores / Giradores", href: "/productos/lineas-y-aparejos/destorcedores-giradores" },
    { label: "Flotadores", href: "/productos/lineas-y-aparejos/flotadores" },
  ] },
  { label: "Herramientas y Accesorios", href: "/productos/herramientas-y-accesorios", items: [
    { label: "Alicates / Pinzas", href: "/productos/herramientas-y-accesorios/alicates-pinzas" },
    { label: "Grips / Básculas", href: "/productos/herramientas-y-accesorios/grips-basculas" },
    { label: "Tijeras / Corta líneas", href: "/productos/herramientas-y-accesorios/tijeras-corta-lineas" },
    { label: "Cajas / Organizadores", href: "/productos/herramientas-y-accesorios/cajas-organizadores" },
    { label: "Herramientas varias", href: "/productos/herramientas-y-accesorios/herramientas-varias" },
  ] },
];

const equipmentSections: FixedMenuSection[] = [
  { label: "Indumentaria", href: "/productos/indumentaria", items: [
    { label: "Jersey", href: "/productos/indumentaria/jersey" },
    { label: "Gorras", href: "/productos/indumentaria/gorras" },
    { label: "Pantalones", href: "/productos/indumentaria/pantalones" },
    { label: "Buff / Máscaras", href: "/productos/indumentaria/buff-mascaras" },
  ] },
  { label: "Equipamiento", href: "/productos/equipamiento", items: [
    { label: "Mochilas", href: "/productos/equipamiento/mochilas" },
    { label: "Tulas", href: "/productos/equipamiento/tulas" },
    { label: "Bolsos", href: "/productos/equipamiento/bolsos" },
  ] },
];

export function FishingArticlesMenu() {
  return <FixedMegaMenu label="Artículos de Pesca" sections={fishingSections} wide />;
}

export function EquipmentMenu() {
  return <FixedMegaMenu label="Indumentaria y Equipamiento" sections={equipmentSections} />;
}

function FixedMegaMenu({ label, sections, wide = false }: { label: string; sections: FixedMenuSection[]; wide?: boolean }) {
  return (
    <div className="group relative">
      <button type="button" className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-sm font-semibold text-dark-blue transition hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {label}<ChevronDown className="size-4 transition group-hover:rotate-180" aria-hidden="true" />
      </button>
      <div className={`invisible z-50 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${wide ? "fixed left-1/2 top-16 w-[min(74rem,calc(100vw-2rem))]" : "absolute left-1/2 top-full w-[min(34rem,calc(100vw-2rem))]"}`}>
        <div className={`grid gap-7 rounded-lg border border-border bg-white p-6 shadow-xl ${wide ? "md:grid-cols-3 xl:grid-cols-6" : "grid-cols-2"}`}>
          {sections.map((section) => <MenuSection key={section.href} section={section} />)}
        </div>
      </div>
    </div>
  );
}

function MenuSection({ section }: { section: FixedMenuSection }) {
  return <section className="min-w-0">
    <h3 className="font-black text-dark-blue">{section.label}</h3>
    <div className="mt-3 space-y-2">
      {section.items.map((item) => <div key={item.href}>
        <Link href={item.href} className="block text-sm leading-5 text-muted-foreground hover:text-primary">{item.label}</Link>
        {item.children?.length ? <div className="mt-2 space-y-1.5 border-l border-border pl-3">{item.children.map((child) =>
          <Link key={child.href} href={child.href} className="block text-xs text-muted-foreground hover:text-primary">{child.label}</Link>
        )}</div> : null}
      </div>)}
    </div>
  </section>;
}

export function MobileFixedNavigation() {
  return <div className="space-y-3">
    <MobileMenuGroup label="Artículos de Pesca" sections={fishingSections} />
    <MobileMenuGroup label="Indumentaria y Equipamiento" sections={equipmentSections} />
  </div>;
}

function MobileMenuGroup({ label, sections }: { label: string; sections: FixedMenuSection[] }) {
  return <details className="rounded-lg border border-border p-2">
    <summary className="cursor-pointer list-none rounded-md px-3 py-2 font-bold text-dark-blue">{label}</summary>
    <div className="mt-2 space-y-4 border-t border-border p-3">{sections.map((section) => <MenuSection key={section.href} section={section} />)}</div>
  </details>;
}
