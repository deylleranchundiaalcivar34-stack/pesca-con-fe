import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { setBrandActive } from "@/app/admin/marcas/acciones";
import { BrandStatusButton } from "@/components/admin/boton-estado-marca";
import { BrandForm } from "@/components/admin/formulario-marca";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brandLogos } from "@/data/datos-negocio";
import { getAdminBrands } from "@/lib/supabase/data";
import { cn } from "@/lib/utilidades";

type BrandFilter = "activas" | "inactivas" | "todas";

const filterLinks: Array<{ href: string; label: string; value: BrandFilter }> = [
  { href: "/admin/marcas", label: "Activas", value: "activas" },
  { href: "/admin/marcas?estado=inactivas", label: "Inactivas", value: "inactivas" },
  { href: "/admin/marcas?estado=todas", label: "Todas", value: "todas" },
];

function getBrandFilter(value?: string | string[]): BrandFilter {
  const filter = Array.isArray(value) ? value[0] : value;
  return filter === "inactivas" || filter === "todas" ? filter : "activas";
}

// Página admin para crear, editar, desactivar y reactivar marcas.
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
          Administra las marcas asignables a productos y sus logos.
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
                <TableHead>Logo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => {
                const fixedLogo = brandLogos.find((item) => item.slug === brand.slug);
                const databaseLogo =
                  brand.cloudinary_secure_url &&
                  Number(brand.cloudinary_width) > 0 &&
                  Number(brand.cloudinary_height) > 0
                    ? {
                        image: brand.cloudinary_secure_url,
                        width: Number(brand.cloudinary_width),
                        height: Number(brand.cloudinary_height),
                      }
                    : null;
                const logo = databaseLogo ?? fixedLogo;

                return (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex min-w-36 items-center gap-3">
                        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
                          {logo ? (
                            <Image
                              src={logo.image}
                              alt={`Logo de ${brand.nombre}`}
                              fill
                              sizes="64px"
                              className="object-contain p-2"
                            />
                          ) : (
                            <span className="px-1 text-center text-[10px] font-semibold text-muted-foreground">
                              Sin imagen
                            </span>
                          )}
                        </div>
                        <Badge variant={databaseLogo ? "success" : fixedLogo ? "outline" : "muted"}>
                          {databaseLogo
                            ? "Administrado"
                            : fixedLogo
                              ? "Fijo del inicio"
                              : "Sin imagen"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-dark-blue">{brand.nombre}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{brand.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={brand.activa ? "success" : "muted"}>
                        {brand.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/marcas/${brand.id}/editar`}>
                            <Pencil aria-hidden="true" />
                            Editar
                          </Link>
                        </Button>
                        <form action={setBrandActive}>
                          <input type="hidden" name="id" value={brand.id} />
                          <input type="hidden" name="active" value={brand.activa ? "false" : "true"} />
                          <BrandStatusButton active={brand.activa} />
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
