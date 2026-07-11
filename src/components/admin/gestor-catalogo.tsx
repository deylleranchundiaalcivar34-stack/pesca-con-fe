"use client";

import { useEffect } from "react";
import { Save, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import {
  createCatalogNode,
  deactivateCatalogNode,
  updateCatalogNode,
} from "@/app/admin/catalogo/acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CatalogNode } from "@/types/producto";
import { cn, slugify } from "@/lib/utilidades";

type CatalogNodeRow = CatalogNode & {
  depth: number;
  pathLabel: string;
};

type CatalogNodeFormValues = {
  name: string;
  slug: string;
};

function flattenNodes(nodes: CatalogNode[], depth = 0, prefix = ""): CatalogNodeRow[] {
  return nodes.flatMap((node) => {
    const pathLabel = prefix ? `${prefix} / ${node.name}` : node.name;
    return [
      { ...node, depth, pathLabel },
      ...flattenNodes(node.children, depth + 1, pathLabel),
    ];
  });
}

function parentOptions(rows: CatalogNodeRow[], currentId?: string) {
  return rows.filter((row) => row.id !== currentId && !row.id.startsWith("fallback-"));
}

// Administra el arbol flexible usado por la navegacion y el catalogo.
export function CatalogManager({ nodes }: { nodes: CatalogNode[] }) {
  const rows = flattenNodes(nodes);

  return (
    <div className="space-y-6">
      <CreateCatalogNodeForm rows={rows} />

      <Card>
        <CardHeader>
          <CardTitle>Nodos del catalogo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Padre</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell className="min-w-64">
                      <form id={`catalog-node-${node.id}`} action={updateCatalogNode}>
                        <input type="hidden" name="id" value={node.id} />
                        <input type="hidden" name="slug" value={node.slug} />
                        <div
                          className="grid gap-2"
                          style={{ paddingLeft: `${Math.min(node.depth, 4) * 1.25}rem` }}
                        >
                          <Input name="name" defaultValue={node.name} aria-label="Nombre" />
                        </div>
                      </form>
                    </TableCell>
                    <TableCell className="min-w-56">
                      <SelectField
                        form={`catalog-node-${node.id}`}
                        name="parentId"
                        defaultValue={node.parentId ?? "root"}
                        rows={parentOptions(rows, node.id)}
                      />
                    </TableCell>
                    <TableCell className="min-w-40">
                      <Input
                        form={`catalog-node-${node.id}`}
                        name="level"
                        defaultValue={node.level}
                        aria-label="Nivel"
                      />
                    </TableCell>
                    <TableCell className="w-28">
                      <Input
                        form={`catalog-node-${node.id}`}
                        name="sortOrder"
                        type="number"
                        defaultValue={node.sortOrder}
                        min={1}
                        aria-label="Orden"
                      />
                    </TableCell>
                    <TableCell>
                      <label className="flex items-center gap-3 text-sm font-semibold text-dark-blue">
                        <input
                          form={`catalog-node-${node.id}`}
                          type="checkbox"
                          name="isActive"
                          defaultChecked={node.isActive}
                          className="size-4 rounded border-border"
                        />
                        <Badge variant={node.isActive ? "success" : "muted"}>
                          {node.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </label>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          form={`catalog-node-${node.id}`}
                          type="submit"
                          size="sm"
                          disabled={node.id.startsWith("fallback-")}
                        >
                          <Save aria-hidden="true" />
                          Guardar
                        </Button>
                        <form action={deactivateCatalogNode}>
                          <input type="hidden" name="id" value={node.id} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={!node.isActive || node.id.startsWith("fallback-")}
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
          </div>
          {!rows.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aun no hay nodos de catalogo.
            </p>
          ) : null}
          {rows.some((row) => row.id.startsWith("fallback-")) ? (
            <p className="mt-4 rounded-md border border-border bg-secondary p-3 text-sm text-muted-foreground">
              Estas viendo el respaldo del catalogo actual. Ejecuta el SQL de docs para habilitar
              la administracion real del arbol.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateCatalogNodeForm({ rows }: { rows: CatalogNodeRow[] }) {
  const { register, control, setValue } = useForm<CatalogNodeFormValues>({
    defaultValues: {
      name: "",
      slug: "",
    },
  });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    setValue("slug", slugify(name), { shouldValidate: true });
  }, [name, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar nodo</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createCatalogNode} className="grid gap-4 lg:grid-cols-4">
          <input type="hidden" name="slug" value={slugify(name)} />
          <div>
            <Label htmlFor="catalog-name">Nombre</Label>
            <Input
              id="catalog-name"
              className="mt-2"
              {...register("name")}
              name="name"
              required
            />
          </div>
          <div>
            <Label htmlFor="catalog-parent">Padre</Label>
            <div className="mt-2">
              <SelectField name="parentId" defaultValue="root" rows={parentOptions(rows)} />
            </div>
          </div>
          <div>
            <Label htmlFor="catalog-level">Nivel</Label>
            <Input id="catalog-level" className="mt-2" name="level" defaultValue="Categoria" />
          </div>
          <div>
            <Label htmlFor="catalog-order">Orden</Label>
            <Input
              id="catalog-order"
              className="mt-2"
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={1}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Menor numero aparece primero.
            </p>
          </div>
          <div className="lg:col-span-4">
            <Button type="submit">
              <Save aria-hidden="true" />
              Guardar nodo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectField({
  rows,
  name,
  defaultValue,
  form,
}: {
  rows: CatalogNodeRow[];
  name: string;
  defaultValue: string;
  form?: string;
}) {
  return (
    <select
      form={form}
      name={name}
      defaultValue={defaultValue}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <option value="root">Sin padre</option>
      {rows.map((row) => (
        <option key={row.id} value={row.id}>
          {"- ".repeat(row.depth)}
          {row.pathLabel}
        </option>
      ))}
    </select>
  );
}
