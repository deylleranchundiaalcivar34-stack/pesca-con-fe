import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { updateCatalogNodeContent } from "@/app/admin/catalogo/acciones";
import { CatalogMainImageField } from "@/components/admin/imagen-principal-catalogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminCatalogNodes } from "@/lib/supabase/data";
import type { CatalogNode } from "@/types/producto";

interface CatalogContentPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}

function findSectionPath(
  sections: CatalogNode[],
  id: string,
  parentPath: CatalogNode[] = [],
): CatalogNode[] | null {
  for (const section of sections) {
    const path = [...parentPath, section];

    if (section.id === id) {
      return path;
    }

    const childPath = findSectionPath(section.children, id, path);

    if (childPath) {
      return childPath;
    }
  }

  return null;
}

// Edita el contenido publico; los campos para buscadores se completan internamente.
export default async function CatalogContentPage({
  params,
  searchParams,
}: CatalogContentPageProps) {
  const [{ id }, query, sections] = await Promise.all([
    params,
    searchParams,
    getAdminCatalogNodes(),
  ]);
  const sectionPath = findSectionPath(sections, id);

  if (!sectionPath) {
    notFound();
  }

  const section = sectionPath.at(-1);

  if (!section || section.id.startsWith("fallback-")) {
    notFound();
  }

  const fullName = sectionPath.map((item) => item.name).join(" / ");
  const publicPath = `/productos/${sectionPath.map((item) => item.slug).join("/")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href="/admin/catalogo">
              <ArrowLeft aria-hidden="true" />
              Volver al catalogo
            </Link>
          </Button>
          <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">
            Editar contenido de pagina
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Modifica la informacion que veran los clientes en esta seccion del catalogo.
          </p>
          <p className="mt-3 font-semibold text-dark-blue">{fullName}</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">{publicPath}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={publicPath} target="_blank">
            Ver pagina publica
            <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {query.guardado === "1" ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Los cambios se guardaron correctamente.
        </div>
      ) : null}

      <form action={updateCatalogNodeContent} className="space-y-4">
        <input type="hidden" name="id" value={section.id} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Informacion visible para clientes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <Field label="Titulo de la pagina" htmlFor="page-title">
              <Input
                id="page-title"
                name="landingTitle"
                defaultValue={section.landingTitle ?? ""}
                placeholder={section.name}
              />
              <HelpText>
                Este titulo aparecera en la pagina publica. Si queda vacio, se usara el nombre de la seccion.
              </HelpText>
            </Field>

            <Field label="Descripcion corta" htmlFor="short-description">
              <Textarea
                id="short-description"
                name="shortDescription"
                defaultValue={section.shortDescription ?? ""}
                rows={3}
              />
              <HelpText>La descripcion corta aparece en la parte superior de la pagina.</HelpText>
            </Field>

            <Field label="Texto informativo" htmlFor="informative-text" className="lg:col-span-2">
              <Textarea
                id="informative-text"
                name="technicalContent"
                defaultValue={section.technicalContent ?? ""}
                rows={5}
              />
              <HelpText>
                Sirve para explicar usos, caracteristicas, recomendaciones u otra informacion util.
              </HelpText>
            </Field>

            <div className="lg:col-span-2">
              <CatalogMainImageField
                currentImage={section.image ?? null}
                currentAlt={section.imageAlt ?? section.name}
              />
            </div>

            <Field label="Texto de la imagen" htmlFor="image-alt" className="lg:col-span-2">
              <Input
                id="image-alt"
                name="imageAlt"
                defaultValue={section.imageAlt ?? ""}
              />
              <HelpText>Describe brevemente lo que aparece en la imagen.</HelpText>
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            <Save aria-hidden="true" />
            Guardar cambios
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/catalogo">Volver al catalogo</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={publicPath} target="_blank">
              Ver pagina publica
              <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function HelpText({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-5 text-muted-foreground">{children}</p>;
}
