import type { BankAccount, BusinessConfig } from "@/types/negocio";
import type { ProductCategory } from "@/types/producto";

// Datos comerciales base usados cuando no dependen de Supabase.
export const businessConfig: BusinessConfig = {
  name: "Pesca Con Fe",
  tagline: "Confianza, pasión y aventura",
  type: "Tienda de artículos de pesca",
  location: "Mega Mercado Municipal, Local N° 145 - Planta Alta",
  city: "Shushufindi",
  country: "Ecuador",
  schedule: "Lunes a Sábado, 08:30 AM - 06:00 PM",
  phones: ["0984967946","0939927826"],
  whatsappPhoneE164: "593939927826",
  email: "pescaconfe@gmail.com",
  social: {
    facebook: "https://www.facebook.com/share/1DgLKz6Qez/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/pesca_con_fe",
    tiktok: "https://www.tiktok.com/@pescaconfe1",
    youtube: "https://www.youtube.com/@pescaconfe1/featured",
    whatsapp: "https://wa.me/message/3VVYXYKPQKUQP1",
  },
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7979.593868717105!2d-76.637618!3d-0.187597!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d7f138f2bf2a27%3A0x76c7ed6cdb45a227!2sStore%20Fishing%20%26%20Camping%20Pesca%20Con%20Fe!5e0!3m2!1ses!2sec!4v1778720578588!5m2!1ses!2sec",
  shippingService: "Servientrega Ecuador",
  shippingBase: 6.5,
  localPickupEnabled: true,
  localPickupInstructions:
    "Retira tu pedido en el Mega Mercado Municipal, Local Nro. 145 - Planta Alta. Espera la confirmación por WhatsApp antes de acercarte.",
};

// Categorias visibles del catalogo y sus imagenes de respaldo.
export const categories: ProductCategory[] = [
  {
    name: "Carretes",
    slug: "carretes",
    description: "Carretes suaves y resistentes para jornadas intensas.",
    image: "/images/categorias/carretes.webp",
    subcategories: [
      { name: "Spinning", slug: "spinning" },
      { name: "Casting", slug: "casting" },
      { name: "Trolling / Convencional", slug: "trolling-convencional" },
    ],
  },
  {
    name: "Cañas",
    slug: "canas",
    description: "Cañas para río, mar, trolling y aventura amazónica.",
    image: "/images/categorias/canas.webp",
    subcategories: [
      { name: "Popping", slug: "popping" },
      { name: "Spinning", slug: "spinning" },
      { name: "Casting", slug: "casting" },
      { name: "Trolling / Convencional", slug: "trolling-convencional" },
    ],
  },
  {
    name: "Indumentaria",
    slug: "indumentaria",
    description: "Protección cómoda para sol, viento y agua.",
    image: "/images/categorias/indumentaria.webp",
    subcategories: [
      { name: "Jersey", slug: "jersey" },
      { name: "Pantalones", slug: "pantalones" },
      { name: "Buff", slug: "buff" },
      { name: "Máscaras", slug: "mascaras" },
    ],
  },
  {
    name: "Combos",
    description: "Paquetes de caña y carrete listos para pescar.",
    slug: "combos",
    image: "/images/categorias/combos.webp",
    subcategories: [
      { name: "Combo Spinning", slug: "combo-spinning" },
      { name: "Combo Casting", slug: "combo-casting" },
      { name: "Combo Trolling / Convencional", slug: "combo-trolling-convencional" },
    ],
  },
  {
    name: "Camping",
    description: "Carpas, mochilas, tulas y bolsos para tus aventuras al aire libre.",
    slug: "camping",
    image: "/images/categorias/camping.webp",
    subcategories: [
      { name: "Mochilas", slug: "mochilas" },
      { name: "Tulas", slug: "tulas" },
      { name: "Bolsos", slug: "bolsos" },
      { name: "Carpas", slug: "carpas" },
    ],
  },
  {
    name: "Herramientas y Accesorios",
    description: "Herramientas necesarias para el mantenimiento y reparación de tu equipo de pesca.",
    slug: "herramientas-y-accesorios",
    image: "/images/categorias/herramientas.webp",
    subcategories: [
      { name: "Alicates / Pinzas", slug: "alicates-pinzas" },
      { name: "Grips / Básculas", slug: "grips-basculas" },
      { name: "Tijeras / Corta líneas", slug: "tijeras-corta-lineas" },
      { name: "Cajas / Organizadores", slug: "cajas-organizadores" },
      { name: "Herramientas varias", slug: "herramientas-varias" },
    ],
  },
  {
    name: "Líneas y Aparejos",
    description: "Herramientas necesarias para el mantenimiento y reparación de tu equipo de pesca.",
    slug: "lineas-y-aparejos",
    image: "/images/categorias/lineas.webp",
    subcategories: [
      { name: "Braid", slug: "braid" },
      { name: "Monofilamento", slug: "monofilamento" },
      { name: "Leaders", slug: "leaders" },
      { name: "Anzuelos", slug: "anzuelos" },
      { name: "Plomos", slug: "plomos" },
      { name: "Destorcedores / Giradores", slug: "destorcedores-giradores" },
      { name: "Flotadores", slug: "flotadores" },
    ],
  },
  {
    name: "Señuelos",
    slug: "senuelos",
    description: "Señuelos seleccionados para río, mar y pesca con jigs.",
    image: "/images/categorias/senuelos.webp",
    subcategories: [
      { name: "Para río", slug: "para-rio" },
      { name: "Para mar", slug: "para-mar" },
      { name: "Jigs", slug: "jigs" },
    ],
  },
];

// Marcas base usadas en filtros y formularios.
export const brands = [
  "Bass Pro Shops",
  "Daiwa",
  "PENN",
  "Rapala",
  "Shimano",
  "Ugly Stik",
  "Okuma inspired Fishing",
  "Marine High Performance",
] as const;

// Logos mostrados en la franja de marcas del inicio.
export const brandLogos = [
  {
    name: "Bass Pro Shops",
    slug: "bass-pro-shops",
    image: "/images/marcas/bass-pro-shop.webp",
    width: 1170,
    height: 922,
    logoClassName: "max-h-24",
  },
  {
    name: "Daiwa",
    slug: "daiwa",
    image: "/images/marcas/daiwa.webp",
    width: 1023,
    height: 209,
  },
  {
    name: "PENN",
    slug: "penn",
    image: "/images/marcas/penn.webp",
    width: 860,
    height: 499,
    logoClassName: "max-h-20",
  },
  {
    name: "Rapala",
    slug: "rapala",
    image: "/images/marcas/rapala-wordmark.webp",
    width: 1200,
    height: 468,
    logoClassName: "w-52 max-w-[88%] max-h-24",
  },
  {
    name: "Shimano",
    slug: "shimano",
    image: "/images/marcas/shimano.webp",
    width: 1129,
    height: 202,
  },
  {
    name: "Ugly Stik",
    slug: "ugly-stik",
    image: "/images/marcas/ugly-stik.webp",
    width: 1008,
    height: 846,
  },
  {
    name: "Okuma inspired Fishing",
    slug: "okuma-inspired-fishing",
    image: "/images/marcas/okuma.webp",
    width: 733,
    height: 240,
  },
  {
    name: "Marine High Performance",
    slug: "marine-high-performance",
    image: "/images/marcas/marine.webp",
    width: 1116,
    height: 330,
  },
] as const;

// Cuentas disponibles para pagos por transferencia.
export const bankAccounts: BankAccount[] = [
  {
    id: "pichincha-ahorro-deyller",
    bank: "Banco Pichincha",
    owner: "Deyller Miguel Anchundia Alcivar",
    cedula: "2100948740",
    logo: {
      src: "/images/metodos-de-pago/banco-pichincha.webp",
      alt: "Logo de Banco Pichincha",
      width: 160,
      height: 160,
    },
    accountType: "Ahorro",
    accountNumber: "2205589763",
  },
  {
    id: "guayaquil-ahorro-milena",
    bank: "Banco Guayaquil",
    owner: "Milena Alcivar",
    cedula: "2100238761",
    logo: {
      src: "/images/metodos-de-pago/banco-guayaquil.webp",
      alt: "Logo de Banco Guayaquil",
      width: 160,
      height: 160,
    },
    accountType: "Ahorro",
    accountNumber: "12828212",
  },
  {
    id: "pacifico-ahorro-milena",
    bank: "Banco del Pacífico",
    owner: "Milena Alcivar",
    cedula: "2100238761",
    logo: {
      src: "/images/metodos-de-pago/banco-del-pacifico.webp",
      alt: "Logo de Banco del Pacifico",
      width: 160,
      height: 160,
    },
    accountType: "Ahorro",
    accountNumber: "1068019904",
  },
];
