import Image from "next/image";
import type { CatalogAttribute, Product } from "@/types/producto";
import { formatCurrency } from "@/lib/utilidades";
import { getEffectivePrice, hasActiveOffer } from "@/lib/precios-producto";

interface VariantComparisonProps {
  product: Product;
  attributes: CatalogAttribute[];
}

// Compara las opciones con los valores que el administrador define para cada variante.
export function VariantComparison({ product, attributes }: VariantComparisonProps) {
  const supportsComparison = ["canas", "carrete", "carretes", "combos"].includes(product.categorySlug);

  if (product.variants.length < 2 || !supportsComparison) return null;

  const visibleAttributes = attributes;

  return (
    <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/65 text-xs font-bold uppercase tracking-wide text-dark-blue">
            <tr>
              <th scope="col" className="whitespace-nowrap px-5 py-4">Referencia</th>
              <th scope="col" className="whitespace-nowrap px-5 py-4">Modelo</th>
              {visibleAttributes.map((attribute) => (
                <th key={attribute.id} scope="col" className="whitespace-nowrap px-5 py-4">
                  {attribute.label}{attribute.unit ? ` (${attribute.unit})` : ""}
                </th>
              ))}
              <th scope="col" className="whitespace-nowrap px-5 py-4">Precio</th>
              <th scope="col" className="whitespace-nowrap px-5 py-4">Disponibilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {product.variants.map((variant) => {
              const hasOffer = hasActiveOffer(variant);

              return (
                <tr key={variant.id} className="transition-colors hover:bg-secondary/35">
                  <td className="px-5 py-3">
                    <div className="relative size-16 overflow-hidden rounded-md border border-border bg-white">
                      <Image
                        src={product.mainImage}
                        alt={`Referencia de ${variant.name}`}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </div>
                  </td>
                  <th scope="row" className="min-w-52 px-5 py-4 font-bold text-dark-blue">
                    {variant.name}
                  </th>
                  {visibleAttributes.map((attribute) => (
                    <td key={attribute.id} className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {variant.attributes[attribute.key] || "—"}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-dark-blue">
                    {hasOffer ? (
                      <span className="mr-2 text-xs font-medium text-muted-foreground line-through">
                        {formatCurrency(variant.price)}
                      </span>
                    ) : null}
                    <span className={hasOffer ? "text-primary" : undefined}>
                      {formatCurrency(getEffectivePrice(variant))}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={variant.stock > 0 ? "font-bold text-emerald-700" : "font-bold text-destructive"}>
                      {variant.stock > 0
                        ? `${variant.stock} ${variant.stock === 1 ? "unidad" : "unidades"}`
                        : "Agotado"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}
