"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit, PackagePlus, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, toggleProductActive } from "@/app/admin/productos/actions";
import type { Product } from "@/types/product";
import { brands, categories } from "@/data/mock-business";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface AdminProductTableProps {
  products: Product[];
}

export function AdminProductTable({ products }: AdminProductTableProps) {
  const [rows, setRows] = useState(products);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [stock, setStock] = useState("all");

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return rows.filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.sku, product.brand].join(" ").toLowerCase().includes(query);
      const matchesCategory = category === "all" || product.categorySlug === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      const matchesStock =
        stock === "all" ||
        (stock === "low" && product.stock > 0 && product.stock <= 4) ||
        (stock === "out" && product.stock === 0) ||
        (stock === "active" && product.isActive);

      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [brand, category, rows, search, stock]);

  const setProductPending = (productId: string, pending: boolean) => {
    setPendingProductIds((current) =>
      pending
        ? [...new Set([...current, productId])]
        : current.filter((id) => id !== productId),
    );
  };

  const toggleActive = (product: Product) => {
    const nextActive = !product.isActive;
    const formData = new FormData();
    formData.set("id", product.id);
    formData.set("active", String(product.isActive));

    setProductPending(product.id, true);
    setRows((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, isActive: nextActive } : item,
      ),
    );

    startTransition(async () => {
      try {
        await toggleProductActive(formData);
      } catch {
        setRows((current) =>
          current.map((item) =>
            item.id === product.id ? { ...item, isActive: product.isActive } : item,
          ),
        );
        toast.error("No se pudo actualizar el estado del producto.");
      } finally {
        setProductPending(product.id, false);
      }
    });
  };

  const hideProduct = (product: Product) => {
    const formData = new FormData();
    formData.set("id", product.id);

    setProductPending(product.id, true);
    setRows((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, isActive: false } : item,
      ),
    );

    startTransition(async () => {
      try {
        await deleteProduct(formData);
      } catch {
        setRows((current) =>
          current.map((item) =>
            item.id === product.id ? { ...item, isActive: product.isActive } : item,
          ),
        );
        toast.error("No se pudo ocultar el producto.");
      } finally {
        setProductPending(product.id, false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, SKU o marca"
            className="pl-9"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[560px]">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {brands.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={setStock}>
            <SelectTrigger>
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="low">Bajo stock</SelectItem>
              <SelectItem value="out">Agotado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild className="w-full lg:w-auto">
          <Link href="/admin/productos/nuevo">
            <PackagePlus aria-hidden="true" />
            Crear
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((product) => (
          <div key={product.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                <Image
                  src={product.mainImage}
                  alt={product.imageAlt}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold text-dark-blue">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
                <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="font-medium">{product.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precio</p>
                <p className="font-bold text-dark-blue">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock</p>
                <Badge variant={product.stock === 0 ? "destructive" : product.stock <= 4 ? "warning" : "success"}>
                  {product.stock}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant={product.isActive ? "success" : "muted"}>
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label={`Editar ${product.name}`}
                title={`Editar ${product.name}`}
              >
                <Link href={`/admin/productos/${product.id}/editar`}>
                  <Edit aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={pendingProductIds.includes(product.id)}
                onClick={() => toggleActive(product)}
                aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
                title={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
              >
                <Power aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={pendingProductIds.includes(product.id) || !product.isActive}
                onClick={() => hideProduct(product)}
                aria-label={`Ocultar ${product.name}`}
                title={`Ocultar ${product.name}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden rounded-lg border border-border bg-white shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 overflow-hidden rounded-md bg-secondary">
                      <Image
                        src={product.mainImage}
                        alt={product.imageAlt}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-blue">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>
                  <Badge variant={product.stock === 0 ? "destructive" : product.stock <= 4 ? "warning" : "success"}>
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? "success" : "muted"}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      aria-label={`Editar ${product.name}`}
                      title={`Editar ${product.name}`}
                    >
                      <Link href={`/admin/productos/${product.id}/editar`}>
                        <Edit aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={pendingProductIds.includes(product.id)}
                      onClick={() => toggleActive(product)}
                      aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
                      title={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
                    >
                      <Power aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={pendingProductIds.includes(product.id) || !product.isActive}
                      onClick={() => hideProduct(product)}
                      aria-label={`Ocultar ${product.name}`}
                      title={`Ocultar ${product.name}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
