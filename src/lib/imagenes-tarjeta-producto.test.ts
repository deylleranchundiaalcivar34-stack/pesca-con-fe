import { describe, expect, it } from "vitest";
import type { ProductImage } from "@/types/producto";
import {
  getAlternateProductImages,
  pickRandomProductImage,
} from "@/lib/imagenes-tarjeta-producto";

function createImage(id: string, url: string): ProductImage {
  return { id, url, alt: `Vista ${id}` };
}

describe("imagenes alternativas de tarjeta", () => {
  it("excluye la principal, vacias y duplicadas", () => {
    const images = [
      createImage("main", "/principal.webp"),
      createImage("second", "/lateral.webp"),
      createImage("duplicate", "/lateral.webp"),
      createImage("empty", "   "),
    ];

    expect(getAlternateProductImages(images, "/principal.webp")).toEqual([
      images[1],
    ]);
  });

  it("no inventa una alternativa cuando el producto solo tiene la principal", () => {
    const images = [createImage("main", "/principal.webp")];

    expect(getAlternateProductImages(images, "/principal.webp")).toEqual([]);
    expect(pickRandomProductImage([])).toBeNull();
  });

  it("elige al azar sin repetir la ultima vista cuando existen otras", () => {
    const images = [
      createImage("one", "/uno.webp"),
      createImage("two", "/dos.webp"),
      createImage("three", "/tres.webp"),
    ];

    expect(pickRandomProductImage(images, "/dos.webp", () => 0)?.url).toBe(
      "/uno.webp",
    );
    expect(pickRandomProductImage(images, "/dos.webp", () => 0.99)?.url).toBe(
      "/tres.webp",
    );
  });
});
