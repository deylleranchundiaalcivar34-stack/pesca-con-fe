"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Copy, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import type { CatalogAttribute, Product, ProductVariant } from "@/types/producto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/tienda-carrito";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { formatCurrency } from "@/lib/utilidades";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";
import { getDiscountPercentage, getEffectivePrice, hasActiveOffer } from "@/lib/precios-producto";
import {
  getProductBaseOptionName,
  isCurricanProduct,
} from "@/lib/opciones-producto";
import { brandLogos } from "@/data/datos-negocio";

interface ProductDetailActionsProps {
  product: Product;
  variantAttributes: CatalogAttribute[];
  selectedImageId?: string;
  onSelectedImageIdChange?: (imageId: string) => void;
  selectedVariantId?: string;
  onSelectedVariantIdChange?: (variantId: string) => void;
}

const PRODUCT_OPTION_PRIORITY: Record<string, string[]> = {
  canas: ["poder", "power", "longitud", "length", "libraje", "linea", "line", "lb"],
  carrete: ["tamano", "size", "relacion", "ratio", "peso", "weight"],
  carretes: ["tamano", "size", "relacion", "ratio", "peso", "weight"],
  combos: ["poder", "power", "longitud", "length", "libraje", "linea", "line", "lb", "tamano", "size", "relacion", "ratio", "peso", "weight"],
};
const CURRICAN_BASE_OPTION = "__currican-base";
const TECHNICAL_SUMMARY_CATEGORIES = new Set(["canas", "carrete", "carretes", "combos", "senuelos"]);

function normalizeOptionName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isPriorityOption(attribute: CatalogAttribute, categorySlug: string) {
  const priorities = PRODUCT_OPTION_PRIORITY[normalizeOptionName(categorySlug)] ?? [];
  const name = normalizeOptionName(`${attribute.key} ${attribute.label}`);
  return priorities.some((priority) => name.includes(priority));
}

// Controla cantidad y agregado al carrito desde la pagina de detalle.
export function ProductDetailActions({
  product,
  variantAttributes,
  selectedImageId,
  onSelectedImageIdChange,
  selectedVariantId: controlledSelectedVariantId,
  onSelectedVariantIdChange,
}: ProductDetailActionsProps) {
  const isCurrican = isCurricanProduct(product);
  const baseOptionName = getProductBaseOptionName(product);
  const isColorVariantLure =
    !isCurrican &&
    normalizeOptionName(product.categorySlug) === "senuelos" &&
    product.variants.some((variant) => Boolean(variant.attributes.color));
  const colorImages = isCurrican || normalizeOptionName(product.categorySlug) !== "senuelos" || isColorVariantLure
    ? []
    : product.images.filter((image) => image.color);
  const [internalSelectedVariantId, setInternalSelectedVariantId] = useState(
    isCurrican && product.stock > 0
      ? CURRICAN_BASE_OPTION
      : product.variants.find((variant) => variant.stock > 0)?.id ?? product.variants[0]?.id ?? "",
  );
  const selectedVariantId = controlledSelectedVariantId ?? internalSelectedVariantId;
  const setSelectedVariantId = (variantId: string) => {
    if (onSelectedVariantIdChange) {
      onSelectedVariantIdChange(variantId);
      return;
    }
    setInternalSelectedVariantId(variantId);
  };
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const currentSource = selectedVariant ?? product;
  const currentPrice = getEffectivePrice(currentSource);
  const currentHasOffer = hasActiveOffer(currentSource);
  const currentStock = selectedVariant?.stock ?? product.stock;
  const [quantity, setQuantity] = useState(currentStock > 0 ? 1 : 0);
  const selectedQuantity =
    currentStock > 0 ? Math.min(Math.max(quantity, 1), currentStock) : 0;
  const addItem = useCartStore((state) => state.addItem);
  const wishlistedProductIds = useWishlistStore((state) => state.productIds);
  const toggleWishlist = useWishlistStore((state) => state.toggleProduct);
  const wishlistHydrated = useWishlistHydrated();
  const isWishlisted = wishlistHydrated && wishlistedProductIds.includes(product.id);
  const outOfStock = currentStock === 0;
  const fixedBrandLogo = brandLogos.find((brand) => brand.slug === product.brandSlug);
  const brandLogo = product.brandLogo
    ? {
        image: product.brandLogo.url,
        width: product.brandLogo.width,
        height: product.brandLogo.height,
      }
    : fixedBrandLogo;
  const selectableAttributes = useMemo(
    () =>
      variantAttributes
        .map((attribute) => ({
          ...attribute,
          values: Array.from(
            new Set(
              product.variants
                .map((variant) => variant.attributes[attribute.key]?.trim())
                .filter((value): value is string => Boolean(value)),
            ),
          ),
        }))
        .filter((attribute) => attribute.values.length > 0),
    [product.variants, variantAttributes],
  );
  const optionSelectors = useMemo(() => {
    const changingAttributes = selectableAttributes.filter((attribute) => attribute.values.length > 1);
    const prioritizedAttributes = changingAttributes.filter((attribute) =>
      isPriorityOption(attribute, product.categorySlug),
    );

    // Preservamos una vía de selección para catálogos que aún no tienen atributos prioritarios.
    return prioritizedAttributes.length ? prioritizedAttributes : changingAttributes;
  }, [product.categorySlug, selectableAttributes]);
  const selectedSpecs = useMemo(() => {
    if (!TECHNICAL_SUMMARY_CATEGORIES.has(normalizeOptionName(product.categorySlug))) {
      return [];
    }

    const filterableAttributes = variantAttributes.filter((attribute) => attribute.isFilterable);
    // Los botones se reservan para las decisiones principales; el resumen sí muestra
    // toda la ficha técnica que alimenta los filtros del catálogo.
    const attributesToDisplay = filterableAttributes.length ? filterableAttributes : selectableAttributes;
    // La ficha del producto sirve como base; una opción solo reemplaza los
    // valores técnicos que declare específicamente.
    const currentAttributes = { ...product.attributes, ...selectedVariant?.attributes };

    return attributesToDisplay
      .map((attribute) => ({
        id: attribute.id,
        label: `${attribute.label}${attribute.unit ? ` (${attribute.unit})` : ""}`,
        value: currentAttributes[attribute.key]?.trim(),
      }))
      .filter((attribute): attribute is { id: string; label: string; value: string } => Boolean(attribute.value));
  }, [product.attributes, product.categorySlug, selectableAttributes, selectedVariant, variantAttributes]);
  const canCompareVariants = product.variants.length > 1 && ["canas", "carrete", "carretes", "combos"].includes(product.categorySlug);
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText = `Mira ${product.name} en Pesca Con Fe`;

  const shareProduct = (platform: "facebook" | "whatsapp") => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const destination =
      platform === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        : `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

    window.open(destination, "_blank", "noopener,noreferrer");
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace del producto copiado");
    } catch {
      toast.error("No pudimos copiar el enlace. Intenta nuevamente.");
    }
  };

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(variant.stock > 0 ? 1 : 0);
  };

  const findVariantForAttribute = (attributeKey: string, value: string, onlyAvailable = false) => {
    const currentAttributes = selectedVariant?.attributes ?? {};
    const candidates = product.variants.filter((variant) =>
      variant.attributes[attributeKey] === value && (!onlyAvailable || variant.stock > 0),
    );

    return candidates.find((variant) =>
      optionSelectors.every((attribute) => {
        if (attribute.key === attributeKey) return true;
        const currentValue = currentAttributes[attribute.key];
        return !currentValue || variant.attributes[attribute.key] === currentValue;
      }),
    ) ?? candidates[0];
  };

  const selectVariantAttribute = (attributeKey: string, value: string) => {
    const candidate = findVariantForAttribute(attributeKey, value, true);

    if (candidate) selectVariant(candidate);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-4">
          <div>
          {currentHasOffer ? (
            <div className="mb-0.5 flex items-center gap-2">
              <p className="text-base text-muted-foreground line-through">
                {formatCurrency(currentSource.price)}
              </p>
              <Badge variant="destructive">-{getDiscountPercentage(currentSource)}%</Badge>
            </div>
          ) : null}
          <p className={`text-3xl font-black ${currentHasOffer ? "text-primary" : "text-dark-blue"}`}>
            {formatCurrency(currentPrice)}
          </p>
          </div>
          {currentHasOffer ? (
            <Badge variant="destructive" className="shrink-0">Oferta activa</Badge>
          ) : null}
        </div>
        <p className={`text-sm font-black uppercase tracking-wide ${outOfStock ? "text-destructive" : "text-emerald-700"}`}>
          {outOfStock
            ? "Producto agotado"
            : `Hay ${currentStock} ${currentStock === 1 ? "unidad" : "unidades"} en stock`}
        </p>
      </div>

      {product.variants.length ? (
        <div className="border-y border-border py-4">
          {isColorVariantLure ? (
            <div>
              <p className="text-sm font-bold text-dark-blue">
                Color:{" "}
                <span className="font-medium text-muted-foreground">
                  {selectedVariant?.attributes.color ?? selectedVariant?.name}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const variantImage =
                    product.images.find((image) => image.variantId === variant.id) ??
                    product.images.find((image) => image.url === variant.image);
                  const colorName = variant.attributes.color || variant.name;
                  const selected = variant.id === selectedVariantId;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectVariant(variant)}
                      className={`relative size-12 overflow-hidden rounded-md border-2 bg-white p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected ? "border-dark-blue" : "border-border hover:border-primary"
                      }`}
                      aria-label={`Seleccionar color ${colorName}`}
                      aria-pressed={selected}
                      title={`${colorName}${variant.stock === 0 ? " · Agotado" : ""}`}
                    >
                      {variantImage ? (
                        <Image src={variantImage.url} alt="" fill sizes="48px" className="object-contain" />
                      ) : (
                        <span className="flex size-full items-center justify-center px-1 text-[9px] font-bold leading-tight text-dark-blue">
                          {colorName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isCurrican ? (
            <label htmlFor="lure-sale-configuration" className="text-sm font-bold text-dark-blue">
              Configuración de venta
            </label>
          ) : optionSelectors.length ? (
            <div className="space-y-4">
              {optionSelectors.map((attribute) => (
                <fieldset key={attribute.id}>
                  <legend className="text-sm font-bold text-dark-blue">
                    {attribute.label}{attribute.unit ? ` (${attribute.unit})` : ""}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attribute.values.map((value) => {
                      const selected = selectedVariant?.attributes[attribute.key] === value;
                      const available = Boolean(findVariantForAttribute(attribute.key, value, true));

                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!available}
                          onClick={() => selectVariantAttribute(attribute.key, value)}
                          className={`min-h-10 rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-dark-blue hover:border-primary"
                          }`}
                          aria-pressed={selected}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : (
            <label htmlFor="product-option" className="text-xs font-bold text-dark-blue">
              Selecciona una opción
            </label>
          )}
          {!isColorVariantLure ? (
          <Select
            value={selectedVariantId}
            onValueChange={(value) => {
              const nextVariant = product.variants.find(
                (variant) => variant.id === value,
              );
              setSelectedVariantId(value);
              setQuantity(
                value === CURRICAN_BASE_OPTION
                  ? product.stock > 0 ? 1 : 0
                  : nextVariant && nextVariant.stock > 0 ? 1 : 0,
              );
            }}
          >
            <SelectTrigger
              id={isCurrican ? "lure-sale-configuration" : "product-option"}
              aria-label={isCurrican ? "Configuración de venta" : "Selecciona una opción"}
              className={isCurrican || !optionSelectors.length ? "mt-2" : "hidden"}
            >
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
            {isCurrican ? (
              <SelectItem value={CURRICAN_BASE_OPTION} disabled={product.stock === 0}>
                {baseOptionName} · {formatCurrency(getEffectivePrice(product))}
                {product.stock === 0 ? " · Agotado" : ""}
              </SelectItem>
            ) : null}
            {product.variants.map((variant) => (
              <SelectItem key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                {variant.name} · {formatCurrency(getEffectivePrice(variant))}
                {variant.stock === 0 ? " · Agotado" : ""}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
          ) : null}
          {selectedVariant?.description && !isCurrican ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-5 text-muted-foreground">
              {selectedVariant.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {selectedSpecs.length ? (
        <div className="space-y-2 border-l-2 border-gold pl-3 text-sm">
          <dl className="grid gap-x-5 gap-y-0.5 sm:grid-cols-2">
            {selectedSpecs.map((spec) => (
              <div key={spec.id} className="flex gap-2">
                <dt className="font-bold text-dark-blue">{spec.label}:</dt>
                <dd className="text-muted-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>
          {canCompareVariants ? (
            <a
              href="#comparar-especificaciones"
              className="inline-flex pt-1 text-sm font-bold text-primary underline underline-offset-4 hover:text-dark-blue"
            >
              Comparar todos los modelos y especificaciones
            </a>
          ) : null}
        </div>
      ) : null}

      {colorImages.length ? (
        <div className="border-y border-border py-4">
          <p className="text-sm font-bold text-dark-blue">
            Color: <span className="font-medium text-muted-foreground">{colorImages.find((image) => image.id === selectedImageId)?.color ?? colorImages[0]?.color}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colorImages.map((image) => {
              const selectedColor = (selectedImageId ?? product.images[0]?.id) === image.id;
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => onSelectedImageIdChange?.(image.id)}
                  className={`relative size-12 overflow-hidden rounded-md border-2 bg-white p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedColor ? "border-dark-blue" : "border-border hover:border-primary"
                  }`}
                  aria-label={`Seleccionar color ${image.color}`}
                  aria-pressed={selectedColor}
                  title={image.color}
                >
                  <Image src={image.url} alt="" fill sizes="48px" className="object-contain" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {brandLogo ? (
        <div className="flex h-12 w-24 items-center justify-center rounded-md border border-border bg-white px-2">
          <Image
            src={brandLogo.image}
            alt={`Logo de ${product.brand}`}
            width={brandLogo.width}
            height={brandLogo.height}
            className="max-h-8 w-auto max-w-full object-contain"
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div>
          <span className="text-sm font-semibold text-dark-blue">Cantidad</span>
          <div className="mt-2 flex h-11 items-center rounded-md border border-border bg-white">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={selectedQuantity <= 1}
            onClick={() => setQuantity(Math.max(selectedQuantity - 1, 1))}
            aria-label="Disminuir cantidad"
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="w-10 text-center text-sm font-semibold">{selectedQuantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={selectedQuantity >= currentStock}
            onClick={() => setQuantity(Math.min(selectedQuantity + 1, currentStock))}
            aria-label="Aumentar cantidad"
          >
            <Plus aria-hidden="true" />
          </Button>
          </div>
        </div>
        <Button
          size="lg"
          className="h-11 w-full"
          disabled={outOfStock}
          onClick={() => {
            addItem(product, selectedQuantity, selectedVariant);
            toast.success(`${selectedQuantity} producto(s) agregado(s) al carrito`);
          }}
        >
          <ShoppingCart aria-hidden="true" />
          Agregar al carrito
        </Button>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={!wishlistHydrated}
          onClick={() => {
            toggleWishlist(product.id);
            toast.success(
              isWishlisted ? "Producto eliminado de tu lista de deseos" : "Producto agregado a tu lista de deseos",
            );
          }}
          aria-label={isWishlisted ? "Quitar de lista de deseos" : "Agregar a lista de deseos"}
          aria-pressed={isWishlisted}
          className={isWishlisted ? "h-10 w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600" : "h-10 w-full"}
        >
          <Heart className={isWishlisted ? "fill-current" : ""} aria-hidden="true" />
          <span>{isWishlisted ? "Quitar de la lista de deseos" : "Añadir a la lista de deseos"}</span>
        </Button>
        <div className="grid gap-4 border-t border-border pt-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Compartir este producto
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => shareProduct("facebook")}
                className="size-9"
                aria-label="Compartir en Facebook"
                title="Compartir en Facebook"
              >
                <Image src="/images/redes-sociales/facebook-icon.webp" alt="" width={20} height={20} aria-hidden="true" className="size-5 object-contain" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => shareProduct("whatsapp")}
                className="size-9"
                aria-label="Compartir en WhatsApp"
                title="Compartir en WhatsApp"
              >
                <Image src="/images/redes-sociales/whatsapp-icon.webp" alt="" width={20} height={20} aria-hidden="true" className="size-5 object-contain" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyShareLink}
                className="size-9"
                aria-label="Copiar enlace del producto"
                title="Copiar enlace"
              >
                <Copy aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="space-y-2.5 sm:border-l sm:border-border sm:pl-4">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-dark-blue">Envío seguro</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Tu producto viaja protegido.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-dark-blue">Entrega estimada</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Recíbelo en 48 a 72 horas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
