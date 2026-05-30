import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { deactivateBrand, updateBrand } from "@/app/admin/marcas/actions";
import { BrandForm } from "@/components/admin/brand-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminBrands } from "@/lib/supabase/data";
import { cn } from "@/lib/utils";

type BrandFilter = "activas" | "inactivas" | "todas";

const filterLinks: Array<{ href: string; label: string; value: BrandFilter }> = [
  { href: "/admin/marcas", label: "Activas", value: "activas" },
  { href: "/admin/marcas?estado=inactivas", label: "Inactivas", value: "inactivas" },
  { href: "/admin/marcas?estado=todas", label: "Todas", value: "todas" },
];

function getBrandFilter(value?: string | string[]): BrandFilter {
  const filter = Array.isArray(value) ? value[0] : value;

  if (filter === "inactivas" || filter === "todas") {
    return filter;
  }

  return "activas";
}

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeFilter = getBrandFilter(params.estado);
  const brands = await getAdminBrands();
  const filteredBrands = brands.filter((brand) => {
    if (activeFilter === "activas") return brand.activa;
    if (activeFilter === "inactivas") return !brand.activa;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Marcas</h1>
        <p className="mt-1 text-muted-foreground">
          Agrega marcas para asignarlas a productos del inventario.
        </p>
      </div>

      <BrandForm />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Marcas registradas</CardTitle>
            <div className="flex flex-wrap gap-2">
              {filterLinks.map((item) => {
                const isActive = activeFilter === item.value;

                return (
                  <Link
                    key={item.value}
                    href={item.href}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white text-dark-blue hover:border-primary hover:bg-secondary",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug automático</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <form id={`brand-${brand.id}`} action={updateBrand}>
                      <input type="hidden" name="id" value={brand.id} />
                      <Input name="name" defaultValue={brand.nombre} aria-label="Nombre" />
                    </form>
                  </TableCell>
                  <TableCell>
                    <input form={`brand-${brand.id}`} type="hidden" name="slug" value={brand.slug} />
                    <Input value={brand.slug} aria-label="Slug automático" readOnly disabled />
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-3 text-sm font-semibold text-dark-blue">
                      <input
                        form={`brand-${brand.id}`}
                        type="checkbox"
                        name="isActive"
                        defaultChecked={brand.activa}
                        className="size-4 rounded border-border"
                      />
                      <Badge variant={brand.activa ? "success" : "muted"}>
                        {brand.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </label>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button form={`brand-${brand.id}`} type="submit" size="sm">
                        <Save aria-hidden="true" />
                        Guardar
                      </Button>
                      <form action={deactivateBrand}>
                        <input type="hidden" name="id" value={brand.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={!brand.activa}
                        >
                          <Trash2 aria-hidden="true" />
                          Quitar
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filteredBrands.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay marcas para este filtro.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
