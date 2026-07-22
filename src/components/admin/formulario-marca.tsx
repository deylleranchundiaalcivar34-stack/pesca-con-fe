"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  saveBrand,
  updateBrand,
  type BrandActionState,
} from "@/app/admin/marcas/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateBrandImageFiles } from "@/lib/seguridad-imagenes";
import { cn, slugify } from "@/lib/utilidades";

const initialBrandActionState: BrandActionState = {
  status: "idle",
  message: "",
};

type BrandFormProps = {
  mode?: "create" | "edit";
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  initialLogo?: {
    url: string;
    width: number;
    height: number;
    source: "database" | "frontend";
  };
  fallbackLogo?: {
    url: string;
    width: number;
    height: number;
    source: "frontend";
  };
};

type SelectedLogo = {
  file: File;
  url: string;
};

// Crea o edita una marca con un único logo, incluyendo drag-and-drop y preview.
export function BrandForm({
  mode = "create",
  brand,
  initialLogo,
  fallbackLogo,
}: BrandFormProps) {
  const action = mode === "create" ? saveBrand : updateBrand;
  const [actionState, formAction, pending] = useActionState(
    action,
    initialBrandActionState,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const selectedLogoRef = useRef<SelectedLogo | null>(null);
  const [name, setName] = useState(brand?.name ?? "");
  const [selectedLogo, setSelectedLogo] = useState<SelectedLogo | null>(null);
  const [removeCurrentLogo, setRemoveCurrentLogo] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const slug = mode === "edit" ? (brand?.slug ?? "") : slugify(name);

  useEffect(() => {
    selectedLogoRef.current = selectedLogo;
  }, [selectedLogo]);

  useEffect(
    () => () => {
      if (selectedLogoRef.current) URL.revokeObjectURL(selectedLogoRef.current.url);
    },
    [],
  );

  const syncInputFile = (file: File | null) => {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    inputRef.current.files = transfer.files;
  };

  useEffect(() => {
    if (actionState.status !== "error") return;
    syncInputFile(selectedLogoRef.current?.file ?? null);
    errorRef.current?.focus({ preventScroll: true });
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [actionState]);

  const selectLogo = async (files: FileList | null) => {
    const nextFiles = Array.from(files ?? []);
    if (!nextFiles.length) return;

    try {
      await validateBrandImageFiles(nextFiles, true);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "No se pudo validar la imagen.",
      );
      syncInputFile(selectedLogoRef.current?.file ?? null);
      return;
    }

    const previous = selectedLogoRef.current;
    if (previous) URL.revokeObjectURL(previous.url);

    const nextLogo = {
      file: nextFiles[0],
      url: URL.createObjectURL(nextFiles[0]),
    };
    selectedLogoRef.current = nextLogo;
    setSelectedLogo(nextLogo);
    setRemoveCurrentLogo(false);
    syncInputFile(nextLogo.file);
    setImageError(null);
  };

  const removeSelectedLogo = () => {
    const current = selectedLogoRef.current;
    if (current) URL.revokeObjectURL(current.url);
    selectedLogoRef.current = null;
    setSelectedLogo(null);
    syncInputFile(null);
    setImageError(null);
  };

  const visibleLogo = selectedLogo
    ? { url: selectedLogo.url, width: 1, height: 1, selected: true }
    : removeCurrentLogo
      ? fallbackLogo
        ? { ...fallbackLogo, selected: false }
        : null
      : initialLogo
        ? { ...initialLogo, selected: false }
        : null;

  const currentLogoIsManaged = initialLogo?.source === "database";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Agregar marca" : "Editar marca"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
          {mode === "edit" ? (
            <input
              type="hidden"
              name="removeLogo"
              value={removeCurrentLogo ? "true" : "false"}
            />
          ) : null}

          {actionState.status === "error" ? (
            <div
              ref={errorRef}
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive outline-none"
            >
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">No se guardaron los cambios</p>
                  <p className="mt-1 leading-6">{actionState.message}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`brand-name-${mode}`}>Nombre</Label>
              <Input
                id={`brand-name-${mode}`}
                name="name"
                className="mt-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                disabled={pending}
                required
              />
            </div>
            <div>
              <Label htmlFor={`brand-slug-${mode}`}>Slug</Label>
              <Input
                id={`brand-slug-${mode}`}
                className="mt-2"
                value={slug}
                readOnly
                disabled
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "create"
                  ? "Se genera automáticamente a partir del nombre."
                  : "Se conserva aunque cambies el nombre."}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor={`brand-image-${mode}`}>
              {mode === "create" ? "Logo obligatorio" : "Logo nuevo (opcional)"}
            </Label>
            <label
              htmlFor={`brand-image-${mode}`}
              aria-disabled={pending}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!pending) setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!pending) setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                if (!pending) void selectLogo(event.dataTransfer.files);
              }}
              className={cn(
                "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center transition-colors hover:border-primary hover:bg-white",
                isDragging && "border-primary bg-white ring-2 ring-primary/20",
                pending && "pointer-events-none cursor-not-allowed opacity-60",
              )}
            >
              <ImagePlus className="size-8 text-primary" aria-hidden="true" />
              <span className="mt-2 font-semibold text-dark-blue">
                {selectedLogo ? "Cambiar imagen seleccionada" : "Seleccionar o arrastrar imagen"}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                JPEG, PNG, WebP o AVIF. Una imagen de máximo 4 MB.
              </span>
            </label>
            <Input
              ref={inputRef}
              id={`brand-image-${mode}`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={pending}
              onChange={(event) => void selectLogo(event.target.files)}
            />
          </div>

          {imageError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{imageError}</span>
            </div>
          ) : null}

          {visibleLogo ? (
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary sm:w-48">
                  <Image
                    src={visibleLogo.url}
                    alt={`Logo de ${name || "la marca"}`}
                    fill
                    sizes="192px"
                    className="object-contain p-3"
                    unoptimized={visibleLogo.selected}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-dark-blue">
                    {selectedLogo
                      ? "Nueva imagen seleccionada"
                      : removeCurrentLogo
                        ? "Logo fijo de la página de inicio"
                        : initialLogo?.source === "frontend"
                          ? "Logo fijo de la página de inicio"
                          : "Logo administrado actual"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedLogo
                      ? selectedLogo.file.name
                      : removeCurrentLogo
                        ? "Al guardar se quitará la imagen administrada y se usará este respaldo local."
                        : initialLogo?.source === "frontend"
                          ? "La franja del inicio conservará este archivo local aunque la base se reinicie."
                          : "Puedes reemplazarla o quitarla por completo."}
                  </p>
                  {selectedLogo ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={pending}
                      onClick={removeSelectedLogo}
                    >
                      <Trash2 aria-hidden="true" />
                      Quitar selección
                    </Button>
                  ) : currentLogoIsManaged ? (
                    <Button
                      type="button"
                      variant={removeCurrentLogo ? "outline" : "destructive"}
                      size="sm"
                      className="mt-3"
                      disabled={pending}
                      onClick={() => setRemoveCurrentLogo((current) => !current)}
                    >
                      {removeCurrentLogo ? (
                        <RotateCcw aria-hidden="true" />
                      ) : (
                        <Trash2 aria-hidden="true" />
                      )}
                      {removeCurrentLogo
                        ? "Conservar imagen administrada"
                        : "Quitar imagen actual"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : mode === "edit" ? (
            <div className="rounded-md border border-border bg-secondary p-3 text-sm text-muted-foreground">
              <p>
                {removeCurrentLogo
                  ? "La imagen administrada se quitará al guardar y la marca quedará sin imagen."
                  : "Esta marca todavía no tiene logo. Puedes agregarlo sin cambiar su slug."}
              </p>
              {removeCurrentLogo ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={pending}
                  onClick={() => setRemoveCurrentLogo(false)}
                >
                  <RotateCcw aria-hidden="true" />
                  Conservar imagen administrada
                </Button>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" disabled={pending} aria-live="polite">
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {pending
              ? mode === "create"
                ? "Creando marca..."
                : "Guardando cambios..."
              : mode === "create"
                ? "Guardar marca"
                : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
