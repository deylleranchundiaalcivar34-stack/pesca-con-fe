"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { Product } from "@/types/product";
import { brands, categories } from "@/data/mock-business";
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
import { slugify } from "@/lib/utils";
import { ImageUploaderMock } from "./image-uploader-mock";

const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  slug: z.string().min(3, "El slug es obligatorio."),
  brand: z.string().min(1, "Selecciona una marca."),
  categorySlug: z.string().min(1, "Selecciona una categoría."),
  subcategorySlug: z.string().min(1, "Selecciona una subcategoría."),
  price: z.number().positive("El precio debe ser mayor a 0."),
  stock: z.number().int().min(0, "El stock no puede ser negativo."),
  description: z.string().min(20, "Agrega una descripción más completa."),
  features: z.string().min(10, "Agrega al menos una característica."),
  youtubeVideoId: z.string().optional(),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
}

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      brand: product?.brand ?? brands[0],
      categorySlug: product?.categorySlug ?? categories[0].slug,
      subcategorySlug: product?.subcategorySlug ?? categories[0].subcategories[0].slug,
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      description: product?.description ?? "",
      features: product?.features.join("\n") ?? "",
      youtubeVideoId: product?.youtubeVideoId ?? "",
      isActive: product?.isActive ?? true,
    },
  });

  const name = useWatch({ control, name: "name" });
  const brand = useWatch({ control, name: "brand" });
  const categorySlug = useWatch({ control, name: "categorySlug" });
  const subcategorySlug = useWatch({ control, name: "subcategorySlug" });
  const isActive = useWatch({ control, name: "isActive" });
  const selectedCategory =
    categories.find((category) => category.slug === categorySlug) ?? categories[0];

  useEffect(() => {
    if (mode === "create") {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [mode, name, setValue]);

  const onSubmit = (values: ProductFormValues) => {
    // TODO: Reemplazar esta simulación por Server Actions conectadas a Supabase Database.
    // TODO: Validar permisos con Supabase Auth + RLS antes de crear o actualizar productos.
    toast.success(
      mode === "create"
        ? `Producto "${values.name}" creado en modo demo.`
        : `Producto "${values.name}" actualizado en modo demo.`,
    );
    router.push("/admin/productos");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del producto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Nombre" error={errors.name?.message}>
              <Input id="name" {...register("name")} />
            </Field>
            <Field id="slug" label="Slug automático" error={errors.slug?.message}>
              <Input id="slug" {...register("slug")} />
            </Field>
            <Field id="brand" label="Marca" error={errors.brand?.message}>
              <Select value={brand} onValueChange={(value) => setValue("brand", value, { shouldValidate: true })}>
                <SelectTrigger id="brand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
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
                  setValue("subcategorySlug", nextCategory?.subcategories[0].slug ?? "", {
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
                  {selectedCategory.subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.slug} value={subcategory.slug}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="price" label="Precio" error={errors.price?.message}>
              <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
            </Field>
            <Field id="stock" label="Stock" error={errors.stock?.message}>
              <Input id="stock" type="number" min="0" {...register("stock", { valueAsNumber: true })} />
            </Field>
            <Field id="youtubeVideoId" label="Link o ID de YouTube" error={errors.youtubeVideoId?.message}>
              <Input
                id="youtubeVideoId"
                placeholder="Ejemplo: aqz-KE-bpKQ"
                {...register("youtubeVideoId")}
              />
            </Field>
            <Field
              id="description"
              label="Descripción"
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              <Textarea id="description" {...register("description")} />
            </Field>
            <Field
              id="features"
              label="Características (una por línea)"
              error={errors.features?.message}
              className="sm:col-span-2"
            >
              <Textarea id="features" {...register("features")} />
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
            <Button type="submit" className="mt-5 w-full" size="lg" disabled={isSubmitting}>
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
            <ImageUploaderMock initialImages={product?.images} />
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
