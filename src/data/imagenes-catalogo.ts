export interface CatalogBanner {
  src: string;
  alt: string;
}

/**
 * Banners locales de las paginas publicas del catalogo.
 *
 * Para cambiar una imagen, edita solo `src` en esta lista. Para agregar una
 * clasificacion o subclasificacion, usa su ruta completa como clave:
 *
 * "canas/casting": {
 *   src: "/images/catalogo/banner_canas_casting.webp",
 *   alt: "Banner de Canas Casting",
 * },
 *
 * Cada ruta activa actual del catalogo esta listada abajo. Para personalizar
 * una, reemplaza solamente su `src` y su `alt`; no cambies la clave.
 * Las rutas nuevas que se creen en Supabase siguen heredando el banner de la
 * categoria principal hasta que las agregues aqui.
 */
const catalogBanners: Record<string, CatalogBanner> = {
  combos: {
    src: "/images/catalogo/banner_nuevo_combo.webp",
    alt: "Banner de la categoria Combos",
  },
  "combos/combo-spinning": {
    src: "/images/catalogo/banner_nuevo_combo.webp",
    alt: "Banner de Combos Spinning",
  },
  "combos/combo-casting": {
    src: "/images/catalogo/banner_nuevo_combo.webp",
    alt: "Banner de Combos Casting",
  },
  "combos/combo-trolling-convencional": {
    src: "/images/catalogo/banner_nuevo_combo.webp",
    alt: "Banner de Combos Trolling Convencional",
  },

  canas: {
    src: "/images/catalogo/banner_nuevo_cana.webp",
    alt: "Banner de la categoria Ca\u00f1as",
  },
  "canas/casting": {
    src: "/images/catalogo/banner_nuevo_cana.webp",
    alt: "Banner de Canas Casting",
  },
  "canas/popping": {
    src: "/images/catalogo/banner_nuevo_cana.webp",
    alt: "Banner de Canas Popping",
  },
  "canas/spinning": {
    src: "/images/catalogo/banner_nuevo_cana.webp",
    alt: "Banner de Canas Spinning",
  },
  "canas/trolling-convencional": {
    src: "/images/catalogo/banner_nuevo_cana.webp",
    alt: "Banner de Canas Trolling Convencional",
  },

  carretes: {
    src: "/images/catalogo/banner_nuevo_carrete.webp",
    alt: "Banner de la categoria Carretes",
  },
  "carretes/casting": {
    src: "/images/catalogo/banner_nuevo_carrete.webp",
    alt: "Banner de Carretes Casting",
  },
  "carretes/spinning": {
    src: "/images/catalogo/banner_nuevo_carrete.webp",
    alt: "Banner de Carretes Spinning",
  },
  "carretes/trolling-convencional": {
    src: "/images/catalogo/banner_nuevo_carrete.webp",
    alt: "Banner de Carretes Trolling Convencional",
  },

  senuelos: {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de la categoria Se\u00f1uelos",
  },
  "senuelos/para-mar": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Senuelos para mar",
  },
  "senuelos/para-mar/curricanes": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Curricanes",
  },
  "senuelos/para-mar/jigs": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Jigs",
  },
  "senuelos/para-mar/jigs/slow-jig": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Slow Jig",
  },
  "senuelos/spinning": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Senuelos Spinning",
  },
  "senuelos/casting": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Senuelos Casting",
  },
  "senuelos/jigging": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Senuelos Jigging",
  },
  "senuelos/trolling": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Senuelos Trolling",
  },
  "senuelos/para-rio": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Senuelos para rio",
  },
  "senuelos/accesorios-para-senuelos": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Accesorios para senuelos",
  },
  "senuelos/accesorios-para-senuelos/asistentes": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Asistentes para senuelos",
  },
  "senuelos/accesorios-para-senuelos/faldas": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Faldas para senuelos",
  },
  "senuelos/accesorios-para-senuelos/anillas-split-rings": {
    src: "/images/catalogo/banner_nuevo_se\u00f1uelo.webp",
    alt: "Banner de Anillas y Split Rings",
  },

  "lineas-y-aparejos": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de la categoria Lineas y aparejos",
  },
  "lineas-y-aparejos/braid": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Lineas Braid",
  },
  "lineas-y-aparejos/monofilamento": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Lineas Monofilamento",
  },
  "lineas-y-aparejos/leaders": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Leaders",
  },
  "lineas-y-aparejos/anzuelos": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Anzuelos",
  },
  "lineas-y-aparejos/plomos": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Plomos",
  },
  "lineas-y-aparejos/destorcedores-giradores": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Destorcedores y Giradores",
  },
  "lineas-y-aparejos/flotadores": {
    src: "/images/catalogo/banner_nuevo_linea.webp",
    alt: "Banner de Flotadores",
  },

  "herramientas-y-accesorios": {
    src: "/images/catalogo/banner_nuevo_herramientas.webp",
    alt: "Banner de la categoria Herramientas y accesorios",
  },
  "herramientas-y-accesorios/alicates-pinzas": {
    src: "/images/catalogo/banner_nuevo_herramientas.webp",
    alt: "Banner de Alicates y Pinzas",
  },
  "herramientas-y-accesorios/grips-basculas": {
    src: "/images/catalogo/banner_nuevo_herramientas.webp",
    alt: "Banner de Grips y Basculas",
  },
  "herramientas-y-accesorios/tijeras-corta-lineas": {
    src: "/images/catalogo/banner_nuevo_herramientas.webp",
    alt: "Banner de Tijeras y Corta Lineas",
  },
  "herramientas-y-accesorios/cajas-organizadores": {
    src: "/images/catalogo/banner_nuevo_herramientas.webp",
    alt: "Banner de Cajas y Organizadores",
  },
  "herramientas-y-accesorios/herramientas-varias": {
    src: "/images/catalogo/banner_nuevo_herramientas.webp",
    alt: "Banner de Herramientas varias",
  },

  indumentaria: {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de la categoria Indumentaria",
  },
  "indumentaria/buff": {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de Buff",
  },
  "indumentaria/jersey": {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de Jersey",
  },
  "indumentaria/mascaras": {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de Mascaras",
  },
  "indumentaria/pantalones": {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de Pantalones",
  },
  "indumentaria/gorras": {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de Gorras",
  },
  "indumentaria/buff-mascaras": {
    src: "/images/catalogo/banner_nuevo_indumentaria.webp",
    alt: "Banner de Buff y Mascaras",
  },

  camping: {
    src: "/images/catalogo/banner_nuevo_camping.webp",
    alt: "Banner de la categoria Camping",
  },
  "camping/mochilas": {
    src: "/images/catalogo/banner_nuevo_camping.webp",
    alt: "Banner de Mochilas",
  },
  "camping/tulas": {
    src: "/images/catalogo/banner_nuevo_camping.webp",
    alt: "Banner de Tulas",
  },
  "camping/bolsos": {
    src: "/images/catalogo/banner_nuevo_camping.webp",
    alt: "Banner de Bolsos",
  },
  "camping/carpas": {
    src: "/images/catalogo/banner_nuevo_camping.webp",
    alt: "Banner de Carpas",
  },
};

export function getCatalogBanner(slugs: string[]): CatalogBanner | undefined {
  for (let depth = slugs.length; depth > 0; depth -= 1) {
    const banner = catalogBanners[slugs.slice(0, depth).join("/")];

    if (banner) return banner;
  }

  return undefined;
}
