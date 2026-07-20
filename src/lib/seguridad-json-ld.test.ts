import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./seguridad-json-ld";

describe("serializeJsonLd", () => {
  it("impide cerrar el elemento script con contenido administrable", () => {
    const payload = {
      name: '</script><script>globalThis.compromised = true</script>',
      description: "pesca\u2028segura\u2029&confiable",
    };

    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(JSON.parse(serialized)).toEqual(payload);
  });
});
