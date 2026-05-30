"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Save } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { saveProduct } from "@/app/admin/productos/actions";
import type { Product, ProductCategory } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn, slugify } from "@/lib/utils";

type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categorySlug: string;
  subcategorySlug: string;
  price: number;
  stock: number;
  description: string;
  features: string;
  youtubeVideoId?: string;
  isActive: boolean;
  isFeatured: boolean;
};

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  categories: ProductCategory[];
  brands: string[];
}

export function ProductForm({ mode, product, categories, brands }: ProductFormProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [selectedImageCount, setSelectedImageCount] = useState(0);
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      sku: product?.sku ?? "",
      brand: product?.brand ?? brands[0] ?? "",
      categorySlug: product?.categorySlug ?? categories[0]?.slug ?? "",
      subcategorySlug: product?.subcategorySlug ?? categories[0]?.subcategories[0]?.slug ?? "",
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      description: product?.description ?? "",
      features: product?.features.join("\n") ?? "",
      youtubeVideoId: product?.youtubeVideoId ?? "",
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
    },
  });

  const name = useWatch({ control, name: "name" });
  const brand = useWatch({ control, name: "brand" });
  const categorySlug = useWatch({ control, name: "categorySlug" });
  const subcategorySlug = useWatch({ control, name: "subcategorySlug" });
  const isActive = useWatch({ control, name: "isActive" });
  const isFeatured = useWatch({ control, name: "isFeatured" });
  const selectedCategory =
    categories.find((category) => category.slug === categorySlug) ?? categories[0];

  useEffect(() => {
    if (mode === "create") {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [mode, name, setValue]);

  const updateSelectedImages = (files: FileList | null) => {
    setSelectedImageCount(files?.length ?? 0);
  };

  return (
    <form action={saveProduct} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <input type="hidden" name="productId" value={product?.id ?? ""} />
      <input type="hidden" name="slug" value={product?.slug ?? slugify(name)} />
      <input type="hidden" name="brand" value={brand} />
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <input type="hidden" name="subcategorySlug" value={subcategorySlug} />
      <input type="hidden" name="isActive" value={isActive ? "on" : ""} />
      <input type="hidden" name="isFeatured" value={isFeatured ? "on" : ""} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del producto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Nombre" error={errors.name?.message}>
              <Input id="name" {...register("name")} name="name" required />
            </Field>
            <Field id="slug" label="Slug automático" error={errors.slug?.message}>
              <Input id="slug" value={product?.slug ?? slugify(name)} readOnly disabled />
            </Field>
            <Field id="sku" label="SKU" error={errors.sku?.message}>
              <Input id="sku" {...register("sku")} name="sku" required />
            </Field>
            <Field id="brand" label="Marca" error={errors.brand?.message}>
              <Select
                value={brand}
                onValueChange={(value) => setValue("brand", value, { shouldValidate: true })}
              >
                <SelectTrigger id="brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="category" label="Categoría" error={errors.categorySlug?.message}>
              <Select
                value={categorySlug}
                onValueChange={(value) => {
                  const nextCategory = categories.find((category) => category.slug === value);
                  setValue("categorySlug", value, { shouldValidate: true });
                  setValue("subcategorySlug", nextCategory?.subcategories[0]?.slug ?? "", {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="subcategory" label="Subcategoría" error={errors.subcategorySlug?.message}>
              <Select
                value={subcategorySlug}
                onValueChange={(value) => setValue("subcategorySlug", value, { shouldValidate: true })}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selectedCategory?.subcategories ?? []).map((subcategory) => (
                    <SelectItem key={subcategory.slug} value={subcategory.slug}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="price" label="Precio" error={errors.price?.message}>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                name="price"
                required
              />
            </Field>
            <Field id="stock" label="Stock" error={errors.stock?.message}>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                name="stock"
                required
              />
            </Field>
            <Field id="youtubeVideoId" label="Link o ID de YouTube" error={errors.youtubeVideoId?.message}>
              <Input
                id="youtubeVideoId"
                placeholder="Ejemplo: aqz-KE-bpKQ"
                {...register("youtubeVideoId")}
                name="youtubeVideoId"
              />
            </Field>
            <Field id="description" label="Descripción" error={errors.description?.message} className="sm:col-span-2">
              <Textarea id="description" {...register("description")} name="description" required />
            </Field>
            <Field id="features" label="Características (una por línea)" error={errors.features?.message} className="sm:col-span-2">
              <Textarea id="features" {...register("features")} name="features" required />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="isActive">Producto activo</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Controla si aparece en el catálogo.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="isFeatured">Producto destacado</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aparece en la página de inicio.
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue("isFeatured", checked)}
              />
            </div>
            <Button type="submit" className="mt-5 w-full" size="lg">
              <Save aria-hidden="true" />
              {mode === "create" ? "Crear producto" : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label
                htmlFor="images"
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDraggingImages(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingImages(false);

                  if (imageInputRef.current) {
                    imageInputRef.current.files = event.dataTransfer.files;
                  }

                  updateSelectedImages(event.dataTransfer.files);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center transition-colors hover:border-primary hover:bg-white",
                  isDraggingImages && "border-primary bg-white ring-2 ring-primary/20",
                )}
              >
                <ImagePlus className="size-8 text-primary" aria-hidden="true" />
                <span className="mt-2 font-semibold text-dark-blue">Subir imágenes</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  Selecciona o arrastra varias imágenes del producto.
                </span>
                {selectedImageCount > 0 ? (
                  <span className="mt-3 rounded-md bg-white px-3 py-1 text-xs font-semibold text-primary">
                    {selectedImageCount} imagen{selectedImageCount === 1 ? "" : "es"} seleccionada
                    {selectedImageCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </label>
              <Input
                ref={imageInputRef}
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={(event) => updateSelectedImages(event.target.files)}
              />
              <Field id="imageAlt" label="Texto alternativo para imágenes nuevas">
                <Input id="imageAlt" name="imageAlt" defaultValue={product?.name ?? ""} />
              </Field>
              {product?.images.length ? (
                <div className="grid gap-3">
                  {product.images.map((image) => (
                    <div key={image.id} className="rounded-lg border border-border p-3">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={480}
                        height={270}
                        className="aspect-video w-full rounded-md object-cover"
                      />
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {image.isMain ? "Principal" : image.alt}
                        </span>
                        {!image.isMain ? (
                          <span className="text-xs text-muted-foreground">
                            La primera imagen subida queda como principal.
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
