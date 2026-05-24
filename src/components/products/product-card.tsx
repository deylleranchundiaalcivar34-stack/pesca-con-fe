"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const outOfStock = product.stock === 0;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
      <Link
        href={`/productos/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={product.mainImage}
            alt={product.imageAlt}
            fill
            priority={product.isFeatured}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.isFeatured ? (
            <Badge variant="premium" className="absolute left-3 top-3">
              Destacado
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {product.category} · {product.subcategory}
            </p>
            <Link href={`/productos/${product.slug}`} className="mt-1 block">
              <h3 className="line-clamp-2 min-h-11 text-base font-bold leading-snug text-dark-blue hover:text-primary">
                {product.name}
              </h3>
            </Link>
          </div>
          <Badge variant={outOfStock ? "destructive" : product.stock <= 3 ? "warning" : "success"}>
            {outOfStock ? "Agotado" : `${product.stock} disp.`}
          </Badge>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{product.brand}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-dark-blue">
            {formatCurrency(product.price)}
          </p>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() => {
              addItem(product, 1);
              toast.success(`${product.name} agregado al carrito`);
            }}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingCart aria-hidden="true" />
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}
