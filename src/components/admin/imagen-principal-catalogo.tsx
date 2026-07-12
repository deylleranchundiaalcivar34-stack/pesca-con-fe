"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CatalogMainImageFieldProps {
  currentImage: string | null;
  currentAlt: string;
}

// Permite previsualizar, reemplazar o quitar la imagen antes de guardar el formulario.
export function CatalogMainImageField({
  currentImage,
  currentAlt,
}: CatalogMainImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const selectImage = (file: File | undefined) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!file) {
      setPreview(removeImage ? null : currentImage);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreview(objectUrl);
    setRemoveImage(false);
  };

  const removeSelectedImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setPreview(null);
    setRemoveImage(true);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-secondary/25 p-4">
      <input type="hidden" name="currentImage" value={currentImage ?? ""} />
      <input type="hidden" name="removeImage" value={removeImage ? "true" : "false"} />

      <div>
        <p className="font-bold text-dark-blue">Imagen principal</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.
        </p>
      </div>

      {preview ? (
        <div className="max-w-xl overflow-hidden rounded-lg border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={currentAlt || "Vista previa de la imagen principal"}
            className="h-56 w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-44 max-w-xl items-center justify-center rounded-lg border border-dashed border-border bg-white text-center sm:h-56">
          <div className="p-6 text-muted-foreground">
            <ImagePlus className="mx-auto size-8" aria-hidden="true" />
            <p className="mt-2 text-sm">Esta pagina no tendra imagen principal.</p>
          </div>
        </div>
      )}

      <div className="max-w-xl">
        <Label htmlFor="main-image-file">Seleccionar imagen</Label>
        <Input
          ref={inputRef}
          id="main-image-file"
          name="imageFile"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="mt-2"
          onChange={(event) => selectImage(event.target.files?.[0])}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!preview}
        onClick={removeSelectedImage}
      >
        <Trash2 aria-hidden="true" />
        Quitar imagen
      </Button>
    </div>
  );
}
