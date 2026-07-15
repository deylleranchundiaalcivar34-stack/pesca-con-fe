"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Copy, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import type { CatalogAttribute, Product, ProductVariant } from "@/types/producto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/tienda-carrito";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { formatCurrency } from "@/lib/utilidades";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";
import { getDiscountPercentage, getEffectivePrice, hasActiveOffer } from "@/lib/precios-producto";
import { brandLogos } from "@/data/datos-negocio";

interface ProductDetailActionsProps {
  product: Product;
  variantAttributes: CatalogAttribute[];
}

// Controla cantidad y agregado al carrito desde la pagina de detalle.
export function ProductDetailActions({ product, variantAttributes }: ProductDetailActionsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const currentSource = selectedVariant ?? product;
  const currentPrice = getEffectivePrice(currentSource);
  const currentHasOffer = hasActiveOffer(currentSource);
  const currentStock = selectedVariant?.stock ?? product.stock;
  const [quantity, setQuantity] = useState(currentStock > 0 ? 1 : 0);
  const addItem = useCartStore((state) => state.addItem);
  const wishlistedProductIds = useWishlistStore((state) => state.productIds);
  const toggleWishlist = useWishlistStore((state) => state.toggleProduct);
  const wishlistHydrated = useWishlistHydrated();
  const isWishlisted = wishlistHydrated && wishlistedProductIds.includes(product.id);
  const outOfStock = currentStock === 0;
  const brandLogo = brandLogos.find((brand) => brand.name === product.brand);
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
  const shortDescription = product.description
    .split(/\r?\n\s*\r?\n/)[0]
    ?.trim();
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

  const selectVariantAttribute = (attributeKey: string, value: string) => {
    const currentAttributes = selectedVariant?.attributes ?? {};
    const candidate = product.variants.find((variant) =>
      variant.attributes[attributeKey] === value &&
      selectableAttributes.every((attribute) => {
        if (attribute.key === attributeKey) return true;
        const currentValue = currentAttributes[attribute.key];
        return !currentValue || variant.attributes[attribute.key] === currentValue;
      }),
    ) ?? product.variants.find((variant) => variant.attributes[attributeKey] === value);

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
        <div className="rounded-lg border border-border bg-secondary p-3">
          {selectableAttributes.length ? (
            <div className="space-y-3">
              {selectableAttributes.map((attribute) => (
                <fieldset key={attribute.id}>
                  <legend className="text-xs font-bold text-dark-blue">
                    {attribute.label}{attribute.unit ? ` (${attribute.unit})` : ""}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attribute.values.map((value) => {
                      const selected = selectedVariant?.attributes[attribute.key] === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => selectVariantAttribute(attribute.key, value)}
                          className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
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
          <select
            id="product-option"
            value={selectedVariantId}
            onChange={(event) => {
              const nextVariant = product.variants.find(
                (variant) => variant.id === event.target.value,
              );
              setSelectedVariantId(event.target.value);
              setQuantity(nextVariant && nextVariant.stock > 0 ? 1 : 0);
            }}
            className={selectableAttributes.length ? "hidden" : "mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-xs font-semibold text-dark-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                {variant.name} · {formatCurrency(getEffectivePrice(variant))}
                {variant.stock === 0 ? " · Agotado" : ""}
              </option>
            ))}
          </select>
          {selectedVariant?.description ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-5 text-muted-foreground">
              {selectedVariant.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {brandLogo ? (
        <div className="flex h-12 w-24 items-center justify-center rounded-md border border-border bg-white px-2">
          <Image
            src={brandLogo.image}
            alt={`Logo de ${brandLogo.name}`}
            width={brandLogo.width}
            height={brandLogo.height}
            className="max-h-8 w-auto max-w-full object-contain"
          />
        </div>
      ) : null}

      {shortDescription ? (
        <div className="border-l-2 border-gold pl-3">
          <p className="text-sm leading-5 text-muted-foreground">
            {shortDescription}
          </p>
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
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
            aria-label="Disminuir cantidad"
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={quantity >= currentStock}
            onClick={() =>
              setQuantity((current) => Math.min(current + 1, currentStock))
            }
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
            addItem(product, quantity, selectedVariant);
            toast.success(`${quantity} producto(s) agregado(s) al carrito`);
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
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Recíbelo en 24 a 48 horas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
