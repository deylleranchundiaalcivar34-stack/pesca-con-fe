export const ECUADOR_UBICACIONES = {
  Azuay: ["Cuenca", "Gualaceo", "Paute", "Girón", "Santa Isabel", "Sígsig"],
  Bolívar: ["Guaranda", "San Miguel", "Chillanes", "Chimbo", "Echeandía", "Caluma"],
  Cañar: ["Azogues", "Cañar", "La Troncal", "Biblián", "El Tambo", "Suscal"],
  Carchi: ["Tulcán", "San Gabriel", "El Ángel", "Mira", "Bolívar", "Huaca"],
  Chimborazo: ["Riobamba", "Alausí", "Guamote", "Guano", "Chambo", "Colta", "Cumandá"],
  Cotopaxi: ["Latacunga", "La Maná", "Pangua", "Pujilí", "Salcedo", "Saquisilí", "Sigchos"],
  "El Oro": ["Machala", "Arenillas", "El Guabo", "Huaquillas", "Pasaje", "Piñas", "Santa Rosa", "Zaruma"],
  Esmeraldas: ["Esmeraldas", "Atacames", "Muisne", "Quinindé", "Río Verde", "San Lorenzo"],
  Galápagos: ["Puerto Baquerizo Moreno", "Puerto Ayora", "Puerto Villamil", "Galápagos"],
  Guayas: ["Guayaquil", "Durán", "Samborondón", "Daule", "Milagro", "Playas", "Naranjal", "Yaguachi"],
  Imbabura: ["Ibarra", "Otavalo", "Atuntaqui", "Cotacachi", "Pimampiro", "Urcuquí"],
  Loja: ["Loja", "Calvas", "Catamayo", "Celica", "Macará", "Paltas", "Saraguro", "Zapotillo"],
  "Los Ríos": ["Babahoyo", "Quevedo", "Buena Fe", "Mocache", "Ventanas", "Vinces"],
  Manabí: ["Portoviejo", "Manta", "Chone", "Jipijapa", "Montecristi", "Pedernales", "Puerto López", "Rocafuerte"],
  "Morona Santiago": ["Macas", "Gualaquiza", "Limón Indanza", "Palora", "Sucúa", "Taisha"],
  Napo: ["Tena", "Archidona", "El Chaco", "Quijos"],
  Orellana: ["Francisco de Orellana", "Aguarico", "La Joya de los Sachas", "Loreto"],
  Pastaza: ["Puyo", "Arajuno", "Mera", "Santa Clara"],
  Pichincha: ["Quito", "Cayambe", "Machachi", "Rumiñahui", "Pedro Vicente Maldonado", "Puerto Quito"],
  "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo", "La Concordia"],
  Sucumbíos: ["Nueva Loja", "Shushufindi", "Lago Agrio", "Cascales", "Cuyabeno", "Putumayo"],
  Tungurahua: ["Ambato", "Baños de Agua Santa", "Cevallos", "Mocha", "Patate", "Quero", "Tisaleo"],
  "Zamora Chinchipe": ["Zamora", "Chinchipe", "El Pangui", "Palanda", "Paquisha", "Yantzaza"],
} as const;

export const ECUADOR_PROVINCIAS = Object.keys(ECUADOR_UBICACIONES);

function normalizarTexto(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function isGalapagosProvince(province?: string) {
  return normalizarTexto(province ?? "") === "galapagos";
}

export function isGalapagosDestination(province?: string, city?: string) {
  return isGalapagosProvince(province) || normalizarTexto(city ?? "") === "galapagos";
}

export function normalizeEcuadorianCedula(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidEcuadorianCedula(value?: string) {
  const cedula = normalizeEcuadorianCedula(value ?? "");

  if (!/^\d{10}$/.test(cedula)) return false;

  const provinceCode = Number(cedula.slice(0, 2));
  const thirdDigit = Number(cedula[2]);

  if (provinceCode < 1 || provinceCode > 24 || thirdDigit > 5) return false;

  const checksum = cedula
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => {
      const doubled = index % 2 === 0 ? Number(digit) * 2 : Number(digit);
      return total + (doubled > 9 ? doubled - 9 : doubled);
    }, 0);
  const verifier = checksum % 10 === 0 ? 0 : 10 - (checksum % 10);

  return verifier === Number(cedula[9]);
}
