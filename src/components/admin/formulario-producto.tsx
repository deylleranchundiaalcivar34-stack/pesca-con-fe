"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Save, Star, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  deleteProductImage,
  saveProduct,
  setProductImageVariant,
  setMainImage,
  type ProductActionState,
} from "@/app/admin/productos/acciones";
import type { CatalogAttribute, CatalogNode, Product, ProductCategory, ProductVariant } from "@/types/producto";
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
import {
  MAX_PRODUCT_IMAGES,
  validateProductImageFiles,
} from "@/lib/seguridad-imagenes";
import {
  DEFAULT_CURRICAN_BASE_OPTION_NAME,
  getAutomaticVariantSummary,
  isLureAccessoryPath,
  MAX_PRODUCT_BASE_OPTION_NAME_LENGTH,
  SIZE_VARIANT_ATTRIBUTE_KEY,
  SIZE_VARIANT_MODE_VALUE,
  VARIANT_MODE_ATTRIBUTE_KEY,
} from "@/lib/opciones-producto";
import { cn, slugify } from "@/lib/utilidades";

const initialProductActionState: ProductActionState = {
  status: "idle",
  message: "",
};

type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  catalogNodeId: string;
  price: number;
  offerPrice?: number;
  baseOptionName: string;
  stock: number;
  description: string;
  features: string;
  youtubeVideoId?: string;
  imageAlt: string;
  isActive: boolean;
  isFeatured: boolean;
};

type SelectedImagePreview = {
  id: string;
  file: File;
  url: string;
  alt: string;
  color: string;
  variantId: string;
};

type ProductVariantMode = "options" | "color" | "size";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  variants?: ProductVariant[];
  categories: ProductCategory[];
  catalogNodes: CatalogNode[];
  brands: string[];
  catalogAttributes: CatalogAttribute[];
  initialAttributes?: Record<string, string>;
}

function findPathByNodeId(nodes: CatalogNode[], nodeId: string): string[] | null {
  for (const node of nodes) {
    if (node.id === nodeId) return [node.id];
    const childPath = findPathByNodeId(node.children, nodeId);
    if (childPath) return [node.id, ...childPath];
  }

  return null;
}

function findPathBySlugs(nodes: CatalogNode[], slugs: string[]): string[] {
  const path: string[] = [];
  let currentNodes = nodes;

  for (const slug of slugs.filter(Boolean)) {
    const match = currentNodes.find((node) => node.slug === slug);
    if (!match) break;
    path.push(match.id);
    currentNodes = match.children;
  }

  return path;
}

function getInitialCatalogPathIds(
  product: Product | undefined,
  nodes: CatalogNode[],
  categories: ProductCategory[],
) {
  const productNodeId = product?.catalogNodeId;
  if (productNodeId) {
    const path = findPathByNodeId(nodes, productNodeId);
    if (path) return path;
  }

  const productPathSlugs = product?.catalogPath.map((item) => item.slug) ?? [];
  const pathFromCatalog = findPathBySlugs(nodes, productPathSlugs);
  if (pathFromCatalog.length) return pathFromCatalog;

  const legacyPath = findPathBySlugs(nodes, [
    product?.categorySlug ?? categories[0]?.slug ?? "",
    product?.subcategorySlug ?? categories[0]?.subcategories[0]?.slug ?? "",
  ]);

  return legacyPath.length ? legacyPath : nodes[0] ? [nodes[0].id] : [];
}

function getCatalogPathByIds(nodes: CatalogNode[], ids: string[]) {
  const path: CatalogNode[] = [];
  let currentNodes = nodes;

  for (const id of ids) {
    const match = currentNodes.find((node) => node.id === id);
    if (!match) break;
    path.push(match);
    currentNodes = match.children;
  }

  return path;
}

function getOptionsForLevel(nodes: CatalogNode[], selectedPathIds: string[], level: number) {
  if (level === 0) return nodes;

  const parentPath = getCatalogPathByIds(nodes, selectedPathIds.slice(0, level));
  return parentPath.at(-1)?.children ?? [];
}

function getInitialVariantMode(variants: ProductVariant[]): ProductVariantMode {
  if (variants.some((variant) => Boolean(variant.attributes.color?.trim()))) {
    return "color";
  }
  if (
    variants.some(
      (variant) =>
        variant.attributes[VARIANT_MODE_ATTRIBUTE_KEY] === SIZE_VARIANT_MODE_VALUE,
    )
  ) {
    return "size";
  }
  return "options";
}

// Formulario principal para crear o editar productos del catalogo.
export function ProductForm({
  mode,
  product,
  variants = [],
  categories,
  catalogNodes,
  brands,
  catalogAttributes,
  initialAttributes,
}: ProductFormProps) {
  const router = useRouter();
  const [actionState, formAction] = useActionState(saveProduct, initialProductActionState);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const selectedImagePreviewsRef = useRef<SelectedImagePreview[]>([]);
  const isSubmittingFormRef = useRef(false);
  const initialCatalogPathIds = getInitialCatalogPathIds(product, catalogNodes, categories);
  const [initialCatalogPathKey] = useState(() => JSON.stringify(initialCatalogPathIds));
  const [initialVariantsKey] = useState(() => JSON.stringify(variants));
  const [initialVariantMode] = useState(() => getInitialVariantMode(variants));
  const [initialAttributeValuesKey] = useState(() =>
    JSON.stringify(initialAttributes ?? product?.attributes ?? {}),
  );
  const [selectedCatalogPathIds, setSelectedCatalogPathIds] = useState(initialCatalogPathIds);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<SelectedImagePreview[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [mainSelectedImageId, setMainSelectedImageId] = useState<string | null>(null);
  const [pendingExistingImageId, setPendingExistingImageId] = useState<string | null>(null);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>(variants);
  const [variantMode, setVariantMode] = useState<ProductVariantMode>(initialVariantMode);
  const hasProductVariants = productVariants.length > 0;
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(
    initialAttributes ?? product?.attributes ?? {},
  );
  const {
    register,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      sku: product?.sku ?? "",
      brand: product?.brand ?? brands[0] ?? "",
      catalogNodeId: initialCatalogPathIds.at(-1) ?? "",
      price: product?.price ?? 0,
      offerPrice: variants.length ? undefined : product?.offerPrice,
      baseOptionName:
        product?.baseOptionName ?? DEFAULT_CURRICAN_BASE_OPTION_NAME,
      stock: product?.stock ?? 0,
      description: product?.description ?? "",
      features: product?.features.join("\n") ?? "",
      youtubeVideoId: product?.youtubeVideoId ?? "",
      imageAlt: product?.name ?? "",
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
    },
  });

  const name = useWatch({ control, name: "name" });
  const brand = useWatch({ control, name: "brand" });
  const price = useWatch({ control, name: "price" });
  const baseOptionName = useWatch({ control, name: "baseOptionName" });
  const stock = useWatch({ control, name: "stock" });
  const isActive = useWatch({ control, name: "isActive" });
  const isFeatured = useWatch({ control, name: "isFeatured" });
  const selectedCatalogPath = getCatalogPathByIds(catalogNodes, selectedCatalogPathIds);
  const selectedCatalogNodeId = selectedCatalogPathIds.at(-1) ?? "";
  const categorySlug = selectedCatalogPath[0]?.slug ?? product?.categorySlug ?? categories[0]?.slug ?? "";
  const isCurrican = selectedCatalogPath.some((node) => node.slug === "curricanes");
  const isLureAccessory = isLureAccessoryPath(selectedCatalogPath);
  const displayedBaseOptionName =
    baseOptionName?.trim() || DEFAULT_CURRICAN_BASE_OPTION_NAME;
  const usesColorVariants = variantMode === "color" && !isCurrican;
  const usesSizeVariants = variantMode === "size" && !isCurrican;
  const usesCalculatedVariants = usesColorVariants || usesSizeVariants;
  const curricanOptions = isCurrican && productVariants.length > 0;
  const subcategorySlug = selectedCatalogPath[1]?.slug ?? product?.subcategorySlug ?? "";
  const categoryAttributes = useMemo(
    () =>
      catalogAttributes.filter(
        (attribute) => attribute.catalogNodeId === selectedCatalogPath[0]?.id,
      ),
    [catalogAttributes, selectedCatalogPath],
  );
  const serializedAttributes = useMemo(
    () => {
      if (isLureAccessory) return "[]";

      return JSON.stringify(
        categoryAttributes.flatMap((attribute) => {
          const value = attributeValues[attribute.key]?.trim() ?? "";
          return value ? [{ attributeId: attribute.id, value }] : [];
        }),
      );
    },
    [attributeValues, categoryAttributes, isLureAccessory],
  );
  const automaticVariantSummary = useMemo(
    () => getAutomaticVariantSummary(productVariants),
    [productVariants],
  );
  const hasUnsavedChanges =
    isDirty ||
    JSON.stringify(selectedCatalogPathIds) !== initialCatalogPathKey ||
    JSON.stringify(productVariants) !== initialVariantsKey ||
    variantMode !== initialVariantMode ||
    JSON.stringify(attributeValues) !== initialAttributeValuesKey ||
    selectedImagePreviews.length > 0;

  useEffect(() => {
    if (mode === "create") {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [mode, name, setValue]);

  useEffect(() => {
    selectedImagePreviewsRef.current = selectedImagePreviews;
  }, [selectedImagePreviews]);

  useEffect(() => {
    const warningMessage =
      "Tienes cambios sin guardar. Si sales ahora, se perderán. Presiona Cancelar para volver y guardarlos, o Aceptar para salir.";

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || isSubmittingFormRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        !hasUnsavedChanges ||
        isSubmittingFormRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.href === window.location.href) return;

      event.preventDefault();
      if (!window.confirm(warningMessage)) return;

      isSubmittingFormRef.current = true;
      if (destination.origin === window.location.origin) {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);
        return;
      }

      window.location.assign(destination.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedChanges, router]);

  useEffect(() => {
    return () => {
      selectedImagePreviewsRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  const syncImageInputFiles = (images: SelectedImagePreview[]) => {
    if (!imageInputRef.current) return;

    const dataTransfer = new DataTransfer();
    images.forEach((image) => dataTransfer.items.add(image.file));
    imageInputRef.current.files = dataTransfer.files;
  };

  useEffect(() => {
    if (actionState.status !== "error") return;

    isSubmittingFormRef.current = false;
    const dataTransfer = new DataTransfer();
    selectedImagePreviewsRef.current.forEach((image) =>
      dataTransfer.items.add(image.file),
    );
    if (imageInputRef.current) imageInputRef.current.files = dataTransfer.files;

    formErrorRef.current?.focus({ preventScroll: true });
    formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [actionState]);

  const updateSelectedImages = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []);
    if (!imageFiles.length) return;

    const currentImages = selectedImagePreviewsRef.current;
    const nextFiles = [...currentImages.map((image) => image.file), ...imageFiles];

    try {
      await validateProductImageFiles(nextFiles);

      if ((product?.images.length ?? 0) + nextFiles.length > MAX_PRODUCT_IMAGES) {
        throw new Error(
          `Un producto puede conservar como máximo ${MAX_PRODUCT_IMAGES} imágenes.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron validar las imágenes.";
      setImageError(message);
      syncImageInputFiles(currentImages);
      return;
    }

    const defaultColorVariant = usesColorVariants ? productVariants[0] : undefined;
    const previews = imageFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^/.]+$/, ""),
      color: defaultColorVariant?.attributes.color ?? defaultColorVariant?.name ?? "",
      variantId: defaultColorVariant?.id ?? "",
    }));
    const nextImages = [...currentImages, ...previews];

    selectedImagePreviewsRef.current = nextImages;
    setSelectedImagePreviews(nextImages);
    syncImageInputFiles(nextImages);
    setImageError(null);

    if (!mainSelectedImageId && !product?.images.length && nextImages.length) {
      setMainSelectedImageId(nextImages[0].id);
    }
  };

  const removeSelectedImage = (id: string) => {
    setSelectedImagePreviews((current) => {
      const imageToRemove = current.find((image) => image.id === id);
      const nextImages = current.filter((image) => image.id !== id);

      if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);

      if (mainSelectedImageId === id) {
        setMainSelectedImageId(product?.images.length ? null : (nextImages[0]?.id ?? null));
      }

      selectedImagePreviewsRef.current = nextImages;
      syncImageInputFiles(nextImages);
      setImageError(null);
      return nextImages;
    });
  };

  const mainSelectedImageIndex = selectedImagePreviews.findIndex(
    (image) => image.id === mainSelectedImageId,
  );

  const runExistingImageAction = async (
    imageId: string,
    action: (productId: string, selectedImageId: string) => Promise<void>,
    successMessage: string,
  ) => {
    if (!product) return;

    setPendingExistingImageId(imageId);

    try {
      await action(product.id, imageId);
      router.refresh();
      toast.success(successMessage);
    } catch {
      toast.error("No pudimos actualizar la imagen. Intenta nuevamente.");
    } finally {
      setPendingExistingImageId(null);
    }
  };

  const saveExistingImageVariant = async (imageId: string, variantId: string) => {
    if (!product) return;

    setPendingExistingImageId(imageId);
    try {
      await setProductImageVariant(
        product.id,
        imageId,
        variantId === "__none" ? null : variantId,
      );
      router.refresh();
      toast.success("Imagen relacionada con el color.");
    } catch {
      toast.error("No pudimos relacionar la imagen con el color.");
    } finally {
      setPendingExistingImageId(null);
    }
  };

  const changeVariantMode = (nextMode: ProductVariantMode) => {
    setVariantMode(nextMode);
    setProductVariants((current) =>
      current.map((item) => {
        const attributes = { ...item.attributes };
        let name = item.name;

        delete attributes.color;
        delete attributes[VARIANT_MODE_ATTRIBUTE_KEY];
        delete attributes[SIZE_VARIANT_ATTRIBUTE_KEY];

        if (nextMode === "color") {
          attributes.color = item.attributes.color?.trim() || item.name;
        }
        if (nextMode === "size") {
          const size =
            item.attributes[SIZE_VARIANT_ATTRIBUTE_KEY]?.trim() || item.name;
          attributes[SIZE_VARIANT_ATTRIBUTE_KEY] = size;
          attributes[VARIANT_MODE_ATTRIBUTE_KEY] = SIZE_VARIANT_MODE_VALUE;
          name = size;
        }

        return { ...item, name, attributes };
      }),
    );

    const defaultVariant = productVariants[0];
    setSelectedImagePreviews((current) =>
      current.map((image) => ({
        ...image,
        color:
          nextMode === "color"
            ? image.color ||
              defaultVariant?.attributes.color ||
              defaultVariant?.name ||
              ""
            : "",
        variantId:
          nextMode === "color"
            ? image.variantId || defaultVariant?.id || ""
            : "",
      })),
    );
  };

  return (
    <form
      action={formAction}
      autoComplete="off"
      onSubmitCapture={() => {
        isSubmittingFormRef.current = true;
      }}
      className="grid w-full max-w-full min-w-0 grid-cols-1 gap-6 overflow-x-hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]"
    >
      <input type="hidden" name="productId" value={product?.id ?? ""} />
      <input type="hidden" name="slug" value={product?.slug ?? slugify(name)} />
      <input type="hidden" name="brand" value={brand} />
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <input type="hidden" name="subcategorySlug" value={subcategorySlug} />
      <input type="hidden" name="curricanConfiguration" value={isCurrican ? "true" : ""} />
      <input
        type="hidden"
        name="variantMode"
        value={isCurrican ? "options" : variantMode}
      />
      <input type="hidden" name="catalogNodeId" value={selectedCatalogNodeId} />
      <input type="hidden" name="isActive" value={isActive ? "on" : ""} />
      <input type="hidden" name="isFeatured" value={isFeatured ? "on" : ""} />
      <input
        type="hidden"
        name="mainImageIndex"
        value={mainSelectedImageIndex >= 0 ? String(mainSelectedImageIndex) : ""}
      />
      <input type="hidden" name="variants" value={JSON.stringify(productVariants)} />
      <input type="hidden" name="attributes" value={serializedAttributes} />
      <input type="hidden" name="newImageColors" value={JSON.stringify(selectedImagePreviews.map((image) => image.color))} />
      <input type="hidden" name="newImageVariantIds" value={JSON.stringify(selectedImagePreviews.map((image) => image.variantId))} />

      {actionState.status === "error" ? (
        <div
          ref={formErrorRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive outline-none xl:col-span-2"
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

      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacion del producto</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Nombre" error={errors.name?.message}>
              <Input id="name" {...register("name")} name="name" required />
            </Field>
            <Field id="slug" label="Slug automatico" error={errors.slug?.message}>
              <Input id="slug" value={product?.slug ?? slugify(name)} readOnly disabled />
            </Field>
            <Field
              id="sku"
              label={
                usesCalculatedVariants ? "SKU del producto o familia" : "SKU"
              }
              error={errors.sku?.message}
            >
              <Input id="sku" {...register("sku")} name="sku" required />
            </Field>
            <Field id="brand" label="Marca" error={errors.brand?.message}>
              <Select
                value={brand}
                onValueChange={(value) =>
                  setValue("brand", value, { shouldDirty: true, shouldValidate: true })
                }
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
            <Field id="catalogNode" label="Ubicacion en catalogo" className="sm:col-span-2">
              <CatalogPathSelector
                nodes={catalogNodes}
                selectedPathIds={selectedCatalogPathIds}
                onChange={(pathIds) => {
                  setSelectedCatalogPathIds(pathIds);
                  setValue("catalogNodeId", pathIds.at(-1) ?? "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </Field>
            {isCurrican ? (
              <Field
                id="baseOptionName"
                label="Nombre de la primera opción o configuración base"
                error={errors.baseOptionName?.message}
                className="sm:col-span-2"
              >
                <Input
                  id="baseOptionName"
                  {...register("baseOptionName", {
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "Completa el nombre de la opción base.",
                  })}
                  name="baseOptionName"
                  maxLength={MAX_PRODUCT_BASE_OPTION_NAME_LENGTH}
                  placeholder="Ejemplo: Señuelo con cabeza y dos faldas, sin aparejos"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este texto será la primera opción que verá el cliente antes de
                  las configuraciones con adicionales.
                </p>
              </Field>
            ) : null}
            <Field
              id="price"
              label={
                usesCalculatedVariants
                  ? "Precio mínimo calculado"
                  : isCurrican
                    ? `Precio base de “${displayedBaseOptionName}”`
                    : "Precio"
              }
              error={errors.price?.message}
            >
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                name="price"
                value={
                  usesCalculatedVariants
                    ? automaticVariantSummary.price
                    : Number.isFinite(price)
                      ? price
                      : ""
                }
                readOnly={usesCalculatedVariants}
                disabled={usesCalculatedVariants}
                required
              />
              {usesCalculatedVariants ? (
                <p className="text-xs text-muted-foreground">
                  Campo bloqueado: se toma automáticamente el menor precio de las{" "}
                  {usesSizeVariants ? "medidas" : "variantes de color"} activas.
                </p>
              ) : null}
            </Field>
            <Field
              id="offerPrice"
              label={
                usesCalculatedVariants
                  ? "Ofertas administradas por variante"
                  : isCurrican
                    ? `Oferta de “${displayedBaseOptionName}” (opcional)`
                    : "Precio de oferta (opcional)"
              }
              error={errors.offerPrice?.message}
            >
              <Input
                id="offerPrice"
                type="number"
                min="0.01"
                max={price > 0.01 ? price - 0.01 : 0}
                step="0.01"
                disabled={
                  usesCalculatedVariants ||
                  (productVariants.length > 0 && !isCurrican)
                }
                {...register("offerPrice", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  validate: (value) =>
                    value === undefined ||
                    (Number.isFinite(value) && value > 0 && value < price) ||
                    "Debe ser mayor que cero y menor que el precio normal.",
                })}
                name="offerPrice"
              />
              {usesCalculatedVariants ? (
                <p className="text-xs text-muted-foreground">
                  Campo bloqueado: si corresponde, configura la oferta dentro de
                  cada {usesSizeVariants ? "tamaño" : "color"}.
                </p>
              ) : curricanOptions ? (
                <p className="text-xs text-muted-foreground">
                  La oferta se aplica al precio base. Los adicionales de cada configuración se suman sin descuento.
                </p>
              ) : productVariants.length ? (
                <p className="text-xs text-muted-foreground">
                  Las ofertas se configuran individualmente en cada opción.
                </p>
              ) : null}
            </Field>
            <Field
              id="stock"
              label={
                usesCalculatedVariants
                  ? "Stock total calculado"
                  : isCurrican
                    ? `Stock de “${displayedBaseOptionName}”`
                    : "Stock"
              }
              error={errors.stock?.message}
            >
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                name="stock"
                value={
                  usesCalculatedVariants
                    ? automaticVariantSummary.stock
                    : Number.isFinite(stock)
                      ? stock
                      : ""
                }
                readOnly={usesCalculatedVariants}
                disabled={usesCalculatedVariants}
                required
              />
              {usesCalculatedVariants ? (
                <p className="text-xs text-muted-foreground">
                  Campo bloqueado: suma automáticamente el inventario de{" "}
                  {usesSizeVariants ? "todos los tamaños" : "todos los colores"}{" "}
                  activos.
                </p>
              ) : null}
            </Field>
            <Field id="youtubeVideoId" label="Link o ID de YouTube" error={errors.youtubeVideoId?.message}>
              <Input
                id="youtubeVideoId"
                placeholder="Ejemplo: aqz-KE-bpKQ"
                {...register("youtubeVideoId")}
                name="youtubeVideoId"
              />
            </Field>
            <Field id="description" label="Descripción comercial" error={errors.description?.message} className="sm:col-span-2">
              <div className="space-y-2">
                <Textarea id="description" {...register("description")} name="description" required />
                <p className="text-xs text-muted-foreground">
                  Usa este espacio para el texto oficial de la marca, beneficios y contenido editorial del producto.
                </p>
              </div>
            </Field>
            {categoryAttributes.length && !isLureAccessory ? (
              <div className="sm:col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-dark-blue">Especificaciones base para filtros</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {curricanOptions
                      ? "Completa estos datos una sola vez: serán la ficha técnica y los filtros de todo el curricán."
                      : usesColorVariants
                        ? "Completa estos datos una sola vez: técnica, medidas y ficha técnica se comparten entre todos los colores."
                      : usesSizeVariants
                        ? "Completa estos datos una sola vez: la ficha técnica se comparte entre todos los tamaños. La medida vendible se configura abajo."
                      : hasProductVariants
                      ? "Este producto usa opciones. Sus especificaciones, selectores y filtros se toman de cada opción más abajo."
                      : "Completa los datos técnicos del modelo general para los filtros de esta categoría."}
                  </p>
                </div>
                <fieldset
                  disabled={
                    hasProductVariants &&
                    !isCurrican &&
                    !usesCalculatedVariants
                  }
                  className="grid gap-4 disabled:cursor-not-allowed disabled:opacity-50 sm:grid-cols-2"
                >
                  {categoryAttributes.map((attribute) => {
                    const inputId = `attribute-${attribute.id}`;
                    const value = attributeValues[attribute.key] ?? "";
                    const dataListId = attribute.options.length
                      ? `attribute-options-${attribute.id}`
                      : undefined;

                    return (
                      <Field
                        key={attribute.id}
                        id={inputId}
                        label={`${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ""}`}
                      >
                        <Input
                          id={inputId}
                          type={attribute.type === "numero" ? "number" : "text"}
                          value={value}
                          list={dataListId}
                          required={
                            attribute.isRequired &&
                            (!hasProductVariants ||
                              isCurrican ||
                              usesCalculatedVariants)
                          }
                          onChange={(event) =>
                            setAttributeValues((current) => ({
                              ...current,
                              [attribute.key]: event.target.value,
                            }))
                          }
                        />
                        {dataListId ? (
                          <datalist id={dataListId}>
                            {attribute.options.map((option) => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        ) : null}
                      </Field>
                    );
                  })}
                </fieldset>
              </div>
            ) : null}
            <Field
              id="features"
              label={
                hasProductVariants
                  ? "Construcción y materiales (una por línea)"
                  : "Características (una por línea)"
              }
              error={errors.features?.message}
              className="sm:col-span-2"
            >
              <div className="space-y-2">
                <Textarea id="features" {...register("features")} name="features" />
                <p className="text-xs text-muted-foreground">
                  {hasProductVariants
                    ? "Ejemplo: blank de grafito, mango de EVA, portacarrete o acabado del producto. No repitas medidas de una opción."
                    : "Agrega información útil del modelo: componentes, referencia, materiales o detalles técnicos que no estén en los filtros."}
                </p>
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                {isCurrican
                  ? "Configuraciones adicionales"
                  : usesColorVariants
                    ? "Colores disponibles"
                    : usesSizeVariants
                      ? "Tamaños disponibles"
                    : "Opciones del producto"}
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isCurrican
                  ? "El señuelo sin aparejo se configura arriba como precio base. Aquí agrega solamente armados o extras, como uno o dos anzuelos o faldas adicionales."
                  : usesColorVariants
                    ? "Cada color tiene identidad propia: SKU, precio, oferta, stock e imágenes. Todos se muestran dentro de este mismo producto."
                    : usesSizeVariants
                      ? "Cada tamaño tiene su propio SKU, precio, oferta y stock. Las imágenes y la ficha comercial pertenecen al producto por color."
                  : "Úsalas cuando el mismo producto se venda en diferentes medidas, capacidades o configuraciones."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setProductVariants((current) => {
                  if (!current.length && !isCurrican) setValue("offerPrice", undefined);
                  return [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      productId: product?.id ?? "",
                      name: "",
                      description: "",
                      attributes: usesColorVariants
                        ? { color: "" }
                        : usesSizeVariants
                          ? {
                              [SIZE_VARIANT_ATTRIBUTE_KEY]: "",
                              [VARIANT_MODE_ATTRIBUTE_KEY]:
                                SIZE_VARIANT_MODE_VALUE,
                            }
                          : {},
                      sku: "",
                      price: price ?? product?.price ?? 0,
                      additionalPrice: 0,
                      offerPrice: undefined,
                      stock: 0,
                      isActive: true,
                      sortOrder: current.length + 1,
                    },
                  ];
                })
              }
            >
              <Plus aria-hidden="true" />
              {isCurrican
                ? "Agregar configuración"
                : usesColorVariants
                  ? "Agregar color"
                  : usesSizeVariants
                    ? "Agregar tamaño"
                    : "Agregar opción"}
            </Button>
          </CardHeader>
          <CardContent>
            {!isCurrican ? (
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <div
                  className={cn(
                    "flex items-start justify-between gap-4 rounded-lg border p-4",
                    usesColorVariants
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-white",
                  )}
                >
                  <div>
                    <Label
                      htmlFor="color-variants"
                      className="font-bold text-dark-blue"
                    >
                      Variantes por color
                    </Label>
                    <p
                      id="color-variants-help"
                      className="mt-1 text-sm leading-6 text-muted-foreground"
                    >
                      Para un mismo modelo disponible en varios colores, cada uno
                      con inventario e imágenes propias.
                    </p>
                  </div>
                  <Switch
                    id="color-variants"
                    checked={usesColorVariants}
                    onCheckedChange={(checked) =>
                      changeVariantMode(checked ? "color" : "options")
                    }
                    aria-describedby="color-variants-help"
                  />
                </div>

                <div
                  className={cn(
                    "flex items-start justify-between gap-4 rounded-lg border p-4",
                    usesSizeVariants
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-white",
                  )}
                >
                  <div>
                    <Label
                      htmlFor="size-variants"
                      className="font-bold text-dark-blue"
                    >
                      Variantes por tamaño
                    </Label>
                    <p
                      id="size-variants-help"
                      className="mt-1 text-sm leading-6 text-muted-foreground"
                    >
                      Ideal para una ficha por color con medidas como 9, 10 o 12
                      pulgadas y stock separado.
                    </p>
                  </div>
                  <Switch
                    id="size-variants"
                    checked={usesSizeVariants}
                    onCheckedChange={(checked) =>
                      changeVariantMode(checked ? "size" : "options")
                    }
                    aria-describedby="size-variants-help"
                  />
                </div>
              </div>
            ) : null}
            {productVariants.length ? (
              <div className="space-y-4">
                {productVariants.map((variant, index) => (
                  <div key={variant.id} className="rounded-lg border border-border bg-secondary/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-bold text-dark-blue">
                        {isCurrican
                          ? `Configuración adicional ${index + 1}`
                          : usesColorVariants
                            ? `Color ${index + 1}`
                            : usesSizeVariants
                              ? `Tamaño ${index + 1}`
                            : `Opción ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={index === 0}
                          aria-label={`Subir opción ${index + 1}`}
                          onClick={() =>
                            setProductVariants((current) => {
                              const next = [...current];
                              [next[index - 1], next[index]] = [next[index], next[index - 1]];
                              return next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 }));
                            })
                          }
                        >
                          <ArrowUp aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={index === productVariants.length - 1}
                          aria-label={`Bajar opción ${index + 1}`}
                          onClick={() =>
                            setProductVariants((current) => {
                              const next = [...current];
                              [next[index], next[index + 1]] = [next[index + 1], next[index]];
                              return next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 }));
                            })
                          }
                        >
                          <ArrowDown aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          aria-label={`Quitar opción ${index + 1}`}
                          onClick={() =>
                            {
                              setProductVariants((current) =>
                                current
                                  .filter((item) => item.id !== variant.id)
                                  .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 })),
                              );
                              setSelectedImagePreviews((current) =>
                                current.map((image) =>
                                  image.variantId === variant.id
                                    ? { ...image, variantId: "", color: "" }
                                    : image,
                                ),
                              );
                            }
                          }
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    {isCurrican ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field id={`variant-name-${index}`} label="Configuración de venta">
                          <Input
                            id={`variant-name-${index}`}
                            value={variant.name}
                            placeholder="Ejemplo: Aparejo con 2 anzuelos Mustad 10/0"
                            onChange={(event) =>
                              setProductVariants((current) =>
                                current.map((item) =>
                                  item.id === variant.id ? { ...item, name: event.target.value } : item,
                                ),
                              )
                            }
                          />
                        </Field>
                        <Field id={`variant-additional-price-${index}`} label="Valor adicional">
                          <Input
                            id={`variant-additional-price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.additionalPrice ?? Math.max(0, variant.price - (price ?? product?.price ?? 0))}
                            onChange={(event) =>
                              setProductVariants((current) =>
                                current.map((item) =>
                                  item.id === variant.id
                                    ? { ...item, additionalPrice: Math.max(0, Number(event.target.value) || 0) }
                                    : item,
                                ),
                              )
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Se suma al precio base del señuelo.
                          </p>
                        </Field>
                        <Field id={`variant-stock-${index}`} label="Stock">
                          <Input
                            id={`variant-stock-${index}`}
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stock}
                            onChange={(event) =>
                              setProductVariants((current) =>
                                current.map((item) =>
                                  item.id === variant.id ? { ...item, stock: Number(event.target.value) } : item,
                                ),
                              )
                            }
                          />
                        </Field>
                      </div>
                    ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        id={`variant-name-${index}`}
                        label={
                          usesColorVariants
                            ? "Nombre del color"
                            : usesSizeVariants
                              ? "Tamaño o medida"
                              : "Nombre de la opción"
                        }
                      >
                        <Input
                          id={`variant-name-${index}`}
                          value={variant.name}
                          placeholder={
                            usesColorVariants
                              ? "Ejemplo: Negro / Rojo"
                              : usesSizeVariants
                                ? "Ejemplo: 9 pulgadas"
                                : "Ejemplo: 7 pies · Medium Heavy · 15-30 lb"
                          }
                          required={
                            usesCalculatedVariants && variant.isActive
                          }
                          onChange={(event) =>
                            setProductVariants((current) =>
                              current.map((item) =>
                                item.id === variant.id
                                  ? {
                                      ...item,
                                      name: event.target.value,
                                      attributes: usesColorVariants
                                        ? { ...item.attributes, color: event.target.value }
                                        : usesSizeVariants
                                          ? {
                                              ...item.attributes,
                                              [SIZE_VARIANT_ATTRIBUTE_KEY]:
                                                event.target.value,
                                              [VARIANT_MODE_ATTRIBUTE_KEY]:
                                                SIZE_VARIANT_MODE_VALUE,
                                            }
                                          : item.attributes,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field
                        id={`variant-sku-${index}`}
                        label={
                          usesColorVariants
                            ? "SKU del color"
                            : usesSizeVariants
                              ? "SKU del tamaño"
                              : "SKU opcional"
                        }
                      >
                        <Input
                          id={`variant-sku-${index}`}
                          value={variant.sku}
                          required={
                            usesCalculatedVariants && variant.isActive
                          }
                          placeholder={
                            usesSizeVariants ? "Ejemplo: FAL-NAR-09" : undefined
                          }
                          onChange={(event) =>
                            setProductVariants((current) =>
                              current.map((item) =>
                                item.id === variant.id ? { ...item, sku: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field id={`variant-price-${index}`} label="Precio">
                        <Input
                          id={`variant-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          required={
                            usesCalculatedVariants && variant.isActive
                          }
                          onChange={(event) =>
                            setProductVariants((current) =>
                              current.map((item) =>
                                item.id === variant.id ? { ...item, price: Number(event.target.value) } : item,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field id={`variant-offer-price-${index}`} label="Precio de oferta (opcional)">
                        <Input
                          id={`variant-offer-price-${index}`}
                          type="number"
                          min="0.01"
                          max={variant.price > 0.01 ? variant.price - 0.01 : 0}
                          step="0.01"
                          value={variant.offerPrice ?? ""}
                          aria-invalid={
                            variant.offerPrice !== undefined &&
                            (variant.offerPrice <= 0 || variant.offerPrice >= variant.price)
                          }
                          onChange={(event) =>
                            setProductVariants((current) =>
                              current.map((item) =>
                                item.id === variant.id
                                  ? {
                                      ...item,
                                      offerPrice: event.target.value
                                        ? Number(event.target.value)
                                        : undefined,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        {variant.offerPrice !== undefined &&
                        (variant.offerPrice <= 0 || variant.offerPrice >= variant.price) ? (
                          <p className="text-xs text-destructive">
                            Debe ser mayor que cero y menor que el precio normal.
                          </p>
                        ) : null}
                      </Field>
                      <Field id={`variant-stock-${index}`} label="Stock">
                        <Input
                          id={`variant-stock-${index}`}
                          type="number"
                          min="0"
                          step="1"
                          value={variant.stock}
                          required={
                            usesCalculatedVariants && variant.isActive
                          }
                          onChange={(event) =>
                            setProductVariants((current) =>
                              current.map((item) =>
                                item.id === variant.id ? { ...item, stock: Number(event.target.value) } : item,
                              ),
                            )
                          }
                        />
                      </Field>
                      {categoryAttributes.length && !usesCalculatedVariants ? (
                        <div className="sm:col-span-2 rounded-md border border-primary/20 bg-white p-3">
                          <p className="text-sm font-bold text-dark-blue">Especificaciones del modelo u opción</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Estos valores alimentan los selectores, filtros y la tabla comparativa pública cuando corresponda.
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {categoryAttributes.map((attribute) => {
                              const inputId = `variant-attribute-${variant.id}-${attribute.id}`;
                              const dataListId = attribute.options.length
                                ? `variant-attribute-options-${variant.id}-${attribute.id}`
                                : undefined;

                              return (
                                <Field
                                  key={attribute.id}
                                  id={inputId}
                                  label={`${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ""}`}
                                >
                                  <Input
                                    id={inputId}
                                    type={attribute.type === "numero" ? "number" : "text"}
                                    list={dataListId}
                                    value={variant.attributes[attribute.key] ?? ""}
                                    required={attribute.isRequired && variant.isActive}
                                    onChange={(event) =>
                                      setProductVariants((current) =>
                                        current.map((item) =>
                                          item.id === variant.id
                                            ? {
                                                ...item,
                                                attributes: {
                                                  ...item.attributes,
                                                  [attribute.key]: event.target.value,
                                                },
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                  />
                                  {dataListId ? (
                                    <datalist id={dataListId}>
                                      {attribute.options.map((option) => (
                                        <option key={option} value={option} />
                                      ))}
                                    </datalist>
                                  ) : null}
                                </Field>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    )}

                    <label className="mt-4 flex items-center justify-between rounded-md border border-border bg-white p-3">
                      <span>
                        <span className="block text-sm font-bold text-dark-blue">
                          {usesSizeVariants
                            ? "Tamaño activo"
                            : usesColorVariants
                              ? "Color activo"
                              : "Opción activa"}
                        </span>
                        <span className="text-xs text-muted-foreground">Disponible para mostrar y vender.</span>
                      </span>
                      <Switch
                        checked={variant.isActive}
                        onCheckedChange={(checked) =>
                          setProductVariants((current) =>
                            current.map((item) =>
                              item.id === variant.id ? { ...item, isActive: checked } : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Este producto usa actualmente el precio y stock generales. Agrega una opción solo si tiene variaciones.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="isActive">Producto activo</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Controla si aparece en el catalogo.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked, { shouldDirty: true })
                }
              />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="isFeatured">Producto destacado</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aparece en la pagina de inicio.
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) =>
                  setValue("isFeatured", checked, { shouldDirty: true })
                }
              />
            </div>
            <ProductSubmitButton mode={mode} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagenes</CardTitle>
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
                  void updateSelectedImages(event.dataTransfer.files);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center transition-colors hover:border-primary hover:bg-white",
                  isDraggingImages && "border-primary bg-white ring-2 ring-primary/20",
                )}
              >
                <ImagePlus className="size-8 text-primary" aria-hidden="true" />
                <span className="mt-2 font-semibold text-dark-blue">Subir imagenes</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  JPEG, PNG, WebP o AVIF. Hasta 6 por carga, 4 MB cada una, 5 MB por lote y {MAX_PRODUCT_IMAGES} guardadas.
                </span>
                {selectedImagePreviews.length > 0 ? (
                  <span className="mt-3 rounded-md bg-white px-3 py-1 text-xs font-semibold text-primary">
                    {selectedImagePreviews.length} imagen
                    {selectedImagePreviews.length === 1 ? "" : "es"} seleccionada
                    {selectedImagePreviews.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </label>
              <Input
                ref={imageInputRef}
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => void updateSelectedImages(event.target.files)}
              />
              {imageError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{imageError} No se agregó ningún archivo de esta selección.</span>
                </div>
              ) : null}
              <Field id="imageAlt" label="Texto alternativo para imagenes nuevas">
                <Input id="imageAlt" {...register("imageAlt")} name="imageAlt" />
              </Field>
              {selectedImagePreviews.length ? (
                <div className="grid gap-3">
                  {selectedImagePreviews.map((image, index) => (
                    <div
                      key={image.id}
                      className={cn(
                        "rounded-lg border bg-white p-3",
                        image.id === mainSelectedImageId ? "border-primary" : "border-border",
                      )}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-md bg-secondary">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 1280px) 372px, 100vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={image.id === mainSelectedImageId ? "premium" : "outline"}
                          onClick={() => setMainSelectedImageId(image.id)}
                        >
                          <Star aria-hidden="true" />
                          {image.id === mainSelectedImageId ? "Principal" : "Hacer principal"}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          aria-label={`Quitar ${image.alt}`}
                          onClick={() => removeSelectedImage(image.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        {index + 1}. {image.alt}
                      </p>
                      {usesColorVariants ? (
                        <Field id={`new-image-color-${image.id}`} label="Color al que pertenece" className="mt-3">
                          <Select
                            value={image.variantId}
                            onValueChange={(variantId) => {
                              const selectedVariant = productVariants.find(
                                (variant) => variant.id === variantId,
                              );
                              setSelectedImagePreviews((current) =>
                                current.map((item) =>
                                  item.id === image.id
                                    ? {
                                        ...item,
                                        variantId,
                                        color:
                                          selectedVariant?.attributes.color ??
                                          selectedVariant?.name ??
                                          "",
                                      }
                                    : item,
                                ),
                              );
                            }}
                          >
                            <SelectTrigger id={`new-image-color-${image.id}`}>
                              <SelectValue placeholder="Selecciona un color" />
                            </SelectTrigger>
                            <SelectContent>
                              {productVariants.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.attributes.color || variant.name || "Color sin nombre"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
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
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={image.isMain ? "premium" : "outline"}
                            onClick={() =>
                              void runExistingImageAction(
                                image.id,
                                setMainImage,
                                "Imagen principal actualizada.",
                              )
                            }
                            disabled={image.isMain || pendingExistingImageId !== null}
                          >
                            <Star aria-hidden="true" />
                            {image.isMain ? "Principal" : "Hacer principal"}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              void runExistingImageAction(
                                image.id,
                                deleteProductImage,
                                "Imagen quitada.",
                              )
                            }
                            disabled={pendingExistingImageId !== null}
                            aria-label={`Quitar ${image.alt}`}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      {usesColorVariants ? (
                        <Field id={`existing-image-color-${image.id}`} label="Color al que pertenece" className="mt-3">
                          <Select
                            value={image.variantId ?? "__none"}
                            disabled={pendingExistingImageId !== null}
                            onValueChange={(variantId) =>
                              void saveExistingImageVariant(image.id, variantId)
                            }
                          >
                            <SelectTrigger id={`existing-image-color-${image.id}`}>
                              <SelectValue placeholder="Selecciona un color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">Sin color relacionado</SelectItem>
                              {productVariants.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.attributes.color || variant.name || "Color sin nombre"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      ) : null}
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

function CatalogPathSelector({
  nodes,
  selectedPathIds,
  onChange,
}: {
  nodes: CatalogNode[];
  selectedPathIds: string[];
  onChange: (pathIds: string[]) => void;
}) {
  const selectedPath = getCatalogPathByIds(nodes, selectedPathIds);
  const levels = [...selectedPath, null].slice(0, selectedPath.length + 1);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {levels.map((node, levelIndex) => {
        const options = getOptionsForLevel(nodes, selectedPathIds, levelIndex);
        if (!options.length) return null;

        return (
          <div key={levelIndex}>
            <Label htmlFor={`catalog-level-${levelIndex}`}>
              {node?.level ?? options[0]?.level ?? "Nivel"}
            </Label>
            <Select
              value={selectedPathIds[levelIndex] ?? ""}
              onValueChange={(value) => onChange([...selectedPathIds.slice(0, levelIndex), value])}
            >
              <SelectTrigger id={`catalog-level-${levelIndex}`} className="mt-2">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}

function ProductSubmitButton({ mode }: { mode: ProductFormProps["mode"] }) {
  const { pending } = useFormStatus();
  const idleLabel = mode === "create" ? "Crear producto" : "Guardar cambios";
  const pendingLabel = mode === "create" ? "Creando producto..." : "Guardando cambios...";

  return (
    <Button
      type="submit"
      className="mt-5 w-full"
      size="lg"
      disabled={pending}
      aria-live="polite"
    >
      {pending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        <Save aria-hidden="true" />
      )}
      {pending ? pendingLabel : idleLabel}
    </Button>
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
