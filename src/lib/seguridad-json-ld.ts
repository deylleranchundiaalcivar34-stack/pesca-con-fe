// Serializa JSON para insertarlo dentro de un <script type="application/ld+json">
// sin permitir que contenido administrable cierre el elemento script.
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
