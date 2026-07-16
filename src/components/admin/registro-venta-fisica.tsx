"use client";

import { useMemo, useState, useTransition } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { createPhysicalSale } from "@/app/admin/ventas-fisicas/acciones";
import type { Product, ProductVariant } from "@/types/producto";
import type { PhysicalSale } from "@/types/venta-fisica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utilidades";

type CartItem = {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  stock: number;
  quantity: number;
  price: number;
};

const paymentLabels = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta", otro: "Otro" } as const;

// Caja rápida del local: los cambios de inventario se validan definitivamente en el servidor.
export function PhysicalSaleRegister({ products, sales }: { products: Product[]; sales: PhysicalSale[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentLabels>("efectivo");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const matchingProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => product.isActive && (product.stock > 0 || product.variants.some((variant) => variant.isActive && variant.stock > 0)) && (!term || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(term))).slice(0, 8);
  }, [products, query]);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addItem(product: Product, variant?: ProductVariant) {
    const stock = variant ? variant.stock : product.stock;
    if (stock < 1) return;
    const key = variant ? `${product.id}:${variant.id}` : product.id;
    setCart((current) => {
      const found = current.find((item) => item.key === key);
      if (found) return current.map((item) => item.key === key ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item);
      return [...current, { key, productId: product.id, variantId: variant?.id, name: variant ? `${product.name} · ${variant.name}` : product.name, sku: variant?.sku || product.sku, stock, quantity: 1, price: variant?.offerPrice ?? variant?.price ?? product.offerPrice ?? product.price }];
    });
    setMessage(null);
  }

  function updateCartItem(key: string, patch: Partial<CartItem>) {
    setCart((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  }

  function submitSale() {
    if (!cart.length) { setMessage("Agrega al menos un producto a la venta."); return; }
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await createPhysicalSale({ items: cart, note, paymentMethod });
        setCart([]); setNote(""); setQuery("");
        setMessage(`Venta ${result.code} guardada y stock actualizado.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No se pudo registrar la venta.");
      }
    });
  }

  return <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
    <Card>
      <CardHeader><CardTitle>Agregar productos</CardTitle><p className="text-sm text-muted-foreground">Busca por producto, SKU o categoría. Si el producto tiene opciones, elige la presentación exacta.</p></CardHeader>
      <CardContent>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca un producto" className="pl-9" /></div>
        <div className="mt-4 grid gap-3">
          {matchingProducts.map((product) => <ProductChoice key={product.id} product={product} onAdd={addItem} />)}
          {!matchingProducts.length ? <p className="rounded-lg bg-secondary p-4 text-center text-sm text-muted-foreground">No hay productos disponibles con esa búsqueda.</p> : null}
        </div>
      </CardContent>
    </Card>

    <Card className="xl:sticky xl:top-6 xl:self-start">
      <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="size-5 text-primary" />Nota de venta</CardTitle><p className="text-sm text-muted-foreground">El stock se descuenta al guardar la venta.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {cart.map((item) => <div key={item.key} className="rounded-lg border border-border p-3"><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="font-semibold text-dark-blue">{item.name}</p><p className="text-xs text-muted-foreground">SKU: {item.sku || "Sin SKU"} · Disponible: {item.stock}</p></div><Button size="icon" variant="ghost" type="button" onClick={() => setCart((current) => current.filter((cartItem) => cartItem.key !== item.key))} aria-label={`Quitar ${item.name}`}><Trash2 /></Button></div><div className="mt-3 grid grid-cols-[auto_1fr] gap-3"><div className="flex items-center rounded-md border border-border"><Button size="icon" variant="ghost" type="button" disabled={item.quantity <= 1} onClick={() => updateCartItem(item.key, { quantity: item.quantity - 1 })}><Minus /></Button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><Button size="icon" variant="ghost" type="button" disabled={item.quantity >= item.stock} onClick={() => updateCartItem(item.key, { quantity: item.quantity + 1 })}><Plus /></Button></div><label className="grid gap-1 text-xs text-muted-foreground">Precio unitario<Input type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateCartItem(item.key, { price: Math.max(0, Number(event.target.value) || 0) })} /></label></div><p className="mt-2 text-right text-sm font-bold text-dark-blue">{formatCurrency(item.price * item.quantity)}</p></div>)}
          {!cart.length ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Tu nota está vacía. Agrega productos desde la lista.</p> : null}
        </div>
        <label className="grid gap-1.5 text-sm font-medium text-dark-blue">Método de pago<Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as keyof typeof paymentLabels)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(paymentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
        <label className="grid gap-1.5 text-sm font-medium text-dark-blue">Nota u observación (opcional)<Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej.: venta mostrador, nombre del cliente o referencia." rows={3} /></label>
        <div className="flex items-end justify-between border-t border-border pt-4"><span className="font-semibold text-dark-blue">Total</span><span className="text-2xl font-black text-primary">{formatCurrency(total)}</span></div>
        {message ? <p className={`rounded-lg p-3 text-sm ${message.includes("guardada") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p> : null}
        <Button type="button" className="w-full" size="lg" disabled={isPending || !cart.length} onClick={submitSale}>{isPending ? "Guardando venta..." : "Guardar venta física"}</Button>
      </CardContent>
    </Card>

    <Card className="xl:col-span-2"><CardHeader><CardTitle>Registro reciente de ventas físicas</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sales.slice(0, 12).map((sale) => <div key={sale.id} className="rounded-lg border border-border p-3"><div className="flex justify-between gap-2"><p className="font-bold text-dark-blue">{sale.code}</p><p className="font-bold text-primary">{formatCurrency(sale.total)}</p></div><p className="mt-1 text-sm text-muted-foreground">{formatDate(sale.createdAt)} · {paymentLabels[sale.paymentMethod]}</p><p className="mt-2 line-clamp-2 text-sm">{sale.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}</p></div>)}{!sales.length ? <p className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">Aún no hay ventas físicas registradas.</p> : null}</CardContent></Card>
  </div>;
}

function ProductChoice({ product, onAdd }: { product: Product; onAdd: (product: Product, variant?: ProductVariant) => void }) {
  const activeVariants = product.variants.filter((variant) => variant.isActive && variant.stock > 0);
  return <div className="rounded-lg border border-border p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-dark-blue">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku} · Stock: {product.stock}</p></div>{!activeVariants.length && product.stock > 0 ? <Button type="button" size="sm" onClick={() => onAdd(product)}>Agregar · {formatCurrency(product.offerPrice ?? product.price)}</Button> : null}</div>{activeVariants.length ? <div className="mt-3 grid gap-2">{activeVariants.map((variant) => <div key={variant.id} className="flex items-center justify-between gap-3 rounded-md bg-secondary/70 p-2 text-sm"><span className="min-w-0 truncate">{variant.name} <span className="text-muted-foreground">· {variant.stock} un.</span></span><Button type="button" variant="outline" size="sm" onClick={() => onAdd(product, variant)}>Agregar · {formatCurrency(variant.offerPrice ?? variant.price)}</Button></div>)}</div> : null}</div>;
}
