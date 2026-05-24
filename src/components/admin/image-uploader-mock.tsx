"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Star } from "lucide-react";
import type { ProductImage } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ImageUploaderMockProps {
  initialImages?: ProductImage[];
}

export function ImageUploaderMock({ initialImages = [] }: ImageUploaderMockProps) {
  const [images, setImages] = useState<ProductImage[]>(
    initialImages.length
      ? initialImages
      : [
          {
            id: "mock-main",
            url: "/images/products/product-placeholder.png",
            alt: "Imagen simulada del producto",
            isMain: true,
          },
        ],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const previews = Array.from(files).map((file, index) => ({
      id: `${file.name}-${index}-${Date.now()}`,
      url: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^/.]+$/, ""),
      isMain: images.length === 0 && index === 0,
    }));

    setImages((current) => [...current, ...previews]);
    // TODO: Reemplazar este preview local por upload real a Cloudinary o Supabase Storage.
  };

  const setMain = (id: string) => {
    setImages((current) =>
      current.map((image) => ({ ...image, isMain: image.id === id })),
    );
  };

  const updateAlt = (id: string, alt: string) => {
    setImages((current) =>
      current.map((image) => (image.id === id ? { ...image, alt } : image)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="images">Imágenes del producto</Label>
        <label
          htmlFor="images"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center hover:border-primary"
        >
          <ImagePlus className="size-8 text-primary" aria-hidden="true" />
          <span className="mt-2 font-semibold text-dark-blue">
            Subir imágenes simuladas
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            Selecciona varias imágenes para ver preview local.
          </span>
        </label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              "rounded-lg border bg-white p-3",
              image.isMain ? "border-primary" : "border-border",
            )}
          >
            <div className="relative aspect-video overflow-hidden rounded-md bg-secondary">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="280px"
                className="object-cover"
                unoptimized={image.url.startsWith("blob:")}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                size="sm"
                variant={image.isMain ? "premium" : "outline"}
                onClick={() => setMain(image.id)}
              >
                <Star aria-hidden="true" />
                {image.isMain ? "Principal" : "Hacer principal"}
              </Button>
            </div>
            <Label htmlFor={`alt-${image.id}`} className="mt-3 block">
              Texto alternativo
            </Label>
            <Input
              id={`alt-${image.id}`}
              className="mt-2"
              value={image.alt}
              onChange={(event) => updateAlt(image.id, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
