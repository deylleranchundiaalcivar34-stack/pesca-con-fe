"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { mockProducts } from "@/data/mock-products";
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
import { formatCurrency } from "@/lib/utils";
import { reduceStockForPaidOrder } from "@/lib/stock";
import type { SalesChannel } from "@/types/order";

export function ManualSaleForm() {
  const [products, setProducts] = useState(mockProducts.filter((product) => product.stock > 0));
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState("Cliente mostrador");
  const [channel, setChannel] = useState<SalesChannel>("presencial");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia bancaria");

  const selectedProduct = products.find((product) => product.id === productId);
  const total = useMemo(
    () => (selectedProduct ? selectedProduct.price * quantity : 0),
    [quantity, selectedProduct],
  );

  const confirmSale = () => {
    if (!selectedProduct) return;

    setProducts((current) =>
      reduceStockForPaidOrder(current, [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSlug: selectedProduct.slug,
          image: selectedProduct.mainImage,
          price: selectedProduct.price,
          quantity,
          categorySlug: selectedProduct.categorySlug,
        },
      ]).filter((product) => product.stock > 0),
    );
    toast.success(`Venta manual confirmada para ${customer}. Stock reducido.`);
    setQuantity(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear venta manual</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="customer">Cliente</Label>
            <Input
              id="customer"
              className="mt-2"
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
            />
          </div>
          <div>
            <Label>Origen</Label>
            <Select value={channel} onValueChange={(value) => setChannel(value as SalesChannel)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Producto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} · stock {product.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              className="mt-2"
              type="number"
              min={1}
              max={selectedProduct?.stock ?? 1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>
          <div>
            <Label>Método de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Transferencia bancaria">Transferencia bancaria</SelectItem>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-3xl font-black text-dark-blue">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        <Button type="button" size="lg" onClick={confirmSale} disabled={!selectedProduct}>
          <CheckCircle2 aria-hidden="true" />
          Confirmar venta y reducir stock
        </Button>
        <p className="text-sm text-muted-foreground">
          TODO: Persistir ventas manuales en Supabase y registrar auditoría del
          movimiento de inventario con RLS.
        </p>
      </CardContent>
    </Card>
  );
}
