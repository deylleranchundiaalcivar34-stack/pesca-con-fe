import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { BrandForm } from "@/components/admin/formulario-marca";
import { Button } from "@/components/ui/button";
import { brandLogos } from "@/data/datos-negocio";
import { getAdminBrandById } from "@/lib/supabase/data";

// Editor de nombre y logo de una marca existente.
export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getAdminBrandById(id);
  if (!brand) notFound();

  const fixedLogo = brandLogos.find((item) => item.slug === brand.slug);
  const databaseLogo =
    brand.cloudinary_secure_url &&
    Number(brand.cloudinary_width) > 0 &&
    Number(brand.cloudinary_height) > 0
      ? {
          url: brand.cloudinary_secure_url,
          width: Number(brand.cloudinary_width),
          height: Number(brand.cloudinary_height),
          source: "database" as const,
        }
      : null;
  const initialLogo =
    databaseLogo ??
    (fixedLogo
      ? {
          url: fixedLogo.image,
          width: fixedLogo.width,
          height: fixedLogo.height,
          source: "frontend" as const,
        }
      : undefined);
  const fallbackLogo =
    databaseLogo && fixedLogo
      ? {
          url: fixedLogo.image,
          width: fixedLogo.width,
          height: fixedLogo.height,
          source: "frontend" as const,
        }
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/admin/marcas">
            <ArrowLeft aria-hidden="true" />
            Volver a marcas
          </Link>
        </Button>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">
          Editar {brand.nombre}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cambia el nombre, reemplaza o quita la imagen sin alterar el slug.
        </p>
      </div>

      <BrandForm
        mode="edit"
        brand={{ id: brand.id, name: brand.nombre, slug: brand.slug }}
        initialLogo={initialLogo}
        fallbackLogo={fallbackLogo}
      />
    </div>
  );
}
