"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  GripVertical,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import {
  createCatalogNode,
  deactivateCatalogNode,
  reorderCatalogSiblings,
  updateCatalogNode,
} from "@/app/admin/catalogo/acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogNode } from "@/types/producto";
import { cn, slugify } from "@/lib/utilidades";

type CatalogSectionRow = CatalogNode & {
  depth: number;
  fullName: string;
  pathSlugs: string[];
};

type CreateSectionFormValues = {
  name: string;
  slug: string;
};

function flattenSections(
  sections: CatalogNode[],
  depth = 0,
  parentName = "",
  parentSlugs: string[] = [],
): CatalogSectionRow[] {
  return sections.flatMap((section) => {
    const fullName = parentName ? `${parentName} / ${section.name}` : section.name;
    const pathSlugs = [...parentSlugs, section.slug];

    return [
      { ...section, depth, fullName, pathSlugs },
      ...flattenSections(section.children, depth + 1, fullName, pathSlugs),
    ];
  });
}

function parentOptions(rows: CatalogSectionRow[], currentId?: string) {
  return rows.filter((row) => row.id !== currentId && !row.id.startsWith("fallback-"));
}

function reorderNodeGroup(
  nodes: CatalogNode[],
  parentId: string | null,
  orderedIds: string[],
): CatalogNode[] {
  if (parentId === null) {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    return orderedIds.map((id) => byId.get(id)).filter((node): node is CatalogNode => Boolean(node));
  }

  return nodes.map((node) =>
    node.id === parentId
      ? { ...node, children: reorderNodeGroup(node.children, null, orderedIds) }
      : { ...node, children: reorderNodeGroup(node.children, parentId, orderedIds) },
  );
}

// Organiza las secciones del menu y separa su estructura del contenido publico.
export function CatalogManager({ nodes }: { nodes: CatalogNode[] }) {
  const router = useRouter();
  const [catalogNodes, setCatalogNodes] = useState(nodes);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isReordering, startReordering] = useTransition();
  const rows = flattenSections(catalogNodes);

  const moveSection = (sourceId: string, targetId: string) => {
    if (sourceId === targetId || isReordering) return;

    const source = rows.find((row) => row.id === sourceId);
    const target = rows.find((row) => row.id === targetId);

    if (!source || !target || source.parentId !== target.parentId) {
      setOrderError("Solo puedes ordenar secciones que pertenecen a la misma categoria padre.");
      return;
    }

    const siblingIds = rows
      .filter((row) => row.parentId === source.parentId)
      .map((row) => row.id);
    const sourceIndex = siblingIds.indexOf(sourceId);
    const targetIndex = siblingIds.indexOf(targetId);
    const orderedIds = [...siblingIds];
    orderedIds.splice(sourceIndex, 1);
    orderedIds.splice(targetIndex, 0, sourceId);

    const previousNodes = catalogNodes;
    setCatalogNodes(reorderNodeGroup(catalogNodes, source.parentId, orderedIds));
    setOrderError("");
    startReordering(async () => {
      try {
        await reorderCatalogSiblings(source.parentId, orderedIds);
        router.refresh();
      } catch (error) {
        setCatalogNodes(previousNodes);
        setOrderError(error instanceof Error ? error.message : "No se pudo guardar el nuevo orden.");
      }
    });
  };

  const moveByStep = (sectionId: string, direction: -1 | 1) => {
    const section = rows.find((row) => row.id === sectionId);
    if (!section) return;
    const siblings = rows.filter((row) => row.parentId === section.parentId);
    const currentIndex = siblings.findIndex((row) => row.id === sectionId);
    const target = siblings[currentIndex + direction];
    if (target) moveSection(sectionId, target.id);
  };

  return (
    <div className="space-y-6">
      <CreateCatalogSectionForm rows={rows} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Secciones existentes</CardTitle>
          <Button
            type="button"
            variant={isOrderMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsOrderMode((current) => !current);
              setDraggedId(null);
            }}
          >
            <GripVertical aria-hidden="true" />
            {isOrderMode ? "Finalizar orden" : "Ordenar secciones"}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm text-muted-foreground">
            {isOrderMode
              ? "Arrastra una seccion entre sus hermanas o utiliza las flechas. No se puede mover a otra categoria padre."
              : "Cada bloque contiene una categoria principal y todas las secciones que dependen de ella."}
          </p>

          {orderError ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
              {orderError}
            </p>
          ) : null}

          {isReordering ? (
            <p className="mb-3 text-sm font-medium text-primary" aria-live="polite">Guardando nuevo orden...</p>
          ) : null}

          <div className="space-y-5">
            {catalogNodes.map((rootNode) => (
              <section
                key={rootNode.id}
                className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                aria-label={`Categoria ${rootNode.name}`}
              >
                {flattenSections([rootNode]).map((section) => (
                  <CatalogSectionCard
                    key={section.id}
                    section={section}
                    rows={rows}
                    draggedId={draggedId}
                    orderMode={isOrderMode}
                    disabled={isReordering}
                    isEditing={editingId === section.id}
                    onToggleEdit={() =>
                      setEditingId((current) => (current === section.id ? null : section.id))
                    }
                    onDragStart={setDraggedId}
                    onDragEnd={() => setDraggedId(null)}
                    onDrop={moveSection}
                    onMove={moveByStep}
                  />
                ))}
              </section>
            ))}
          </div>

          {!rows.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aun no hay secciones en el catalogo.
            </p>
          ) : null}

          {rows.some((row) => row.id.startsWith("fallback-")) ? (
            <p className="mt-4 rounded-md border border-border bg-secondary p-3 text-sm text-muted-foreground">
              Se esta mostrando una copia de respaldo. La edicion estara disponible cuando la conexion con el catalogo se restablezca.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CatalogSectionCard({
  section,
  rows,
  draggedId,
  orderMode,
  disabled: orderDisabled,
  isEditing,
  onToggleEdit,
  onDragStart,
  onDragEnd,
  onDrop,
  onMove,
}: {
  section: CatalogSectionRow;
  rows: CatalogSectionRow[];
  draggedId: string | null;
  orderMode: boolean;
  disabled: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (sourceId: string, targetId: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const formId = `catalog-section-${section.id}`;
  const publicPath = `/productos/${section.pathSlugs.join("/")}`;
  const isFallback = section.id.startsWith("fallback-");
  const siblings = rows.filter((row) => row.parentId === section.parentId);
  const siblingIndex = siblings.findIndex((row) => row.id === section.id);
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex >= 0 && siblingIndex < siblings.length - 1;
  const canAcceptDrop = draggedId
    ? rows.find((row) => row.id === draggedId)?.parentId === section.parentId
    : false;

  return (
    <article
      className={cn(
        "border-b border-border last:border-b-0",
        section.depth === 0 ? "bg-secondary/55" : "bg-white",
        draggedId === section.id && "opacity-45",
        canAcceptDrop && draggedId !== section.id && "bg-primary/5",
      )}
      onDragOver={(event) => {
        if (orderMode && canAcceptDrop) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (orderMode && draggedId && canAcceptDrop) onDrop(draggedId, section.id);
        onDragEnd();
      }}
    >
      <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex min-w-0 items-center gap-2"
          style={{ paddingLeft: `${Math.min(section.depth, 5) * 22}px` }}
        >
          {orderMode ? (
            <button
              type="button"
              draggable={!isFallback && !orderDisabled}
              disabled={isFallback || orderDisabled}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", section.id);
                onDragStart(section.id);
              }}
              onDragEnd={onDragEnd}
              className="cursor-grab rounded p-1 text-muted-foreground transition hover:bg-secondary hover:text-dark-blue active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Arrastrar ${section.name} para cambiar su orden`}
              title="Arrastrar para ordenar"
            >
              <GripVertical className="size-5" aria-hidden="true" />
            </button>
          ) : section.depth > 0 ? (
            <span className="size-2 shrink-0 rounded-full bg-border" aria-hidden="true" />
          ) : null}

          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-dark-blue">{section.name}</h2>
            <Badge variant={section.isActive ? "success" : "muted"}>
              {section.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">{publicPath}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
          {orderMode ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={!canMoveUp || isFallback || orderDisabled}
                onClick={() => onMove(section.id, -1)}
                aria-label={`Subir ${section.name}`}
                title="Subir"
              >
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={!canMoveDown || isFallback || orderDisabled}
                onClick={() => onMove(section.id, 1)}
                aria-label={`Bajar ${section.name}`}
                title="Bajar"
              >
                <ChevronDown aria-hidden="true" />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleEdit}
            aria-expanded={isEditing}
            aria-controls={`${formId}-panel`}
          >
            <Pencil aria-hidden="true" />
            {isEditing ? "Cerrar" : section.depth === 0 ? "Editar estructura" : "Editar"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/catalogo/${section.id}/contenido`}>
              <FileText aria-hidden="true" />
              Editar contenido
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={publicPath} target="_blank">
              <ExternalLink aria-hidden="true" />
              Ver
            </Link>
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div id={`${formId}-panel`} className="border-t border-border bg-secondary/20 p-3 sm:p-4">
          <div className="rounded-md border border-border bg-white p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Esto define como aparece la seccion dentro del menu de productos.
          </p>

          <form id={formId} action={updateCatalogNode} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input type="hidden" name="id" value={section.id} />

            <Field label="Nombre" htmlFor={`${formId}-name`}>
              <Input id={`${formId}-name`} name="name" defaultValue={section.name} required />
            </Field>

            <Field label="URL amigable" htmlFor={`${formId}-slug`}>
              <Input id={`${formId}-slug`} name="slug" defaultValue={section.slug} required />
              <HelpText>Cambiarla puede modificar el enlace publico de esta pagina.</HelpText>
            </Field>

            <Field label="Tipo de seccion" htmlFor={`${formId}-level`}>
              <Input id={`${formId}-level`} name="level" defaultValue={section.level} required />
            </Field>

            <Field label="Categoria padre" htmlFor={`${formId}-parent`}>
              <SelectField
                id={`${formId}-parent`}
                name="parentId"
                defaultValue={section.parentId ?? "root"}
                rows={parentOptions(rows, section.id)}
              />
            </Field>

            <label className="flex items-start gap-3 rounded-md border border-border bg-white p-3">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={section.isActive}
                className="mt-1 size-4 rounded border-border"
              />
              <span>
                <span className="block text-sm font-bold text-dark-blue">Seccion activa</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Las secciones inactivas no aparecen en el menu publico.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-3">
              <Button type="submit" disabled={isFallback}>
                <Save aria-hidden="true" />
                Guardar estructura
              </Button>
            </div>
          </form>

          <form action={deactivateCatalogNode} className="mt-3">
            <input type="hidden" name="id" value={section.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!section.isActive || isFallback}
            >
              <Trash2 aria-hidden="true" />
              Desactivar seccion
            </Button>
          </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function CreateCatalogSectionForm({ rows }: { rows: CatalogSectionRow[] }) {
  const { register, control, setValue } = useForm<CreateSectionFormValues>({
    defaultValues: { name: "", slug: "" },
  });
  const name = useWatch({ control, name: "name" });
  const friendlyUrl = slugify(name);

  useEffect(() => {
    setValue("slug", friendlyUrl, { shouldValidate: true });
  }, [friendlyUrl, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar una seccion al catalogo</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-5 text-sm text-muted-foreground">
          Crea una categoria o una seccion que aparecera dentro del menu de productos.
        </p>
        <form action={createCatalogNode} className="grid gap-4 lg:grid-cols-3">
          <input type="hidden" name="slug" value={friendlyUrl} />
          <Field label="Nombre de la seccion" htmlFor="catalog-name">
            <Input id="catalog-name" {...register("name")} name="name" required />
            {friendlyUrl ? <HelpText>URL amigable: {friendlyUrl}</HelpText> : null}
          </Field>
          <Field label="Categoria padre" htmlFor="catalog-parent">
            <SelectField
              id="catalog-parent"
              name="parentId"
              defaultValue="root"
              rows={parentOptions(rows)}
            />
          </Field>
          <Field label="Tipo de seccion" htmlFor="catalog-level">
            <Input id="catalog-level" name="level" defaultValue="Categoria" required />
          </Field>
          <div className="lg:col-span-3">
            <Button type="submit">
              <Save aria-hidden="true" />
              Guardar seccion
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{children}</p>;
}

function SelectField({
  rows,
  id,
  name,
  defaultValue,
}: {
  rows: CatalogSectionRow[];
  id: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <option value="root">Sin categoria padre</option>
      {rows.map((row) => (
        <option key={row.id} value={row.id}>
          {"- ".repeat(row.depth)}
          {row.fullName}
        </option>
      ))}
    </select>
  );
}
