"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit, PackagePlus, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

  const toggleActive = (id: string) => {
    setRows((current) =>
      current.map((product) =>
        product.id === id ? { ...product, isActive: !product.isActive } : product,
      ),
    );
    toast.success("Estado del producto actualizado en modo demo.");
  };

  const remove = (id: string) => {
    setRows((current) => current.filter((product) => product.id !== id));
    toast.success("Producto eliminado de la tabla mock.");
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
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <PackagePlus aria-hidden="true" />
            Crear
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
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
                    <Button asChild size="icon" variant="ghost" aria-label={`Editar ${product.name}`}>
                      <Link href={`/admin/productos/${product.id}/editar`}>
                        <Edit aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActive(product.id)}
                      aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
                    >
                      <Power aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(product.id)}
                      aria-label={`Eliminar ${product.name}`}
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
