import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/formulario-producto";
import {
  getAdminProductById,
  getAdminProductAttributes,
  getAdminProductVariants,
  getBrands,
  getCatalogAttributes,
  getCatalogNavigation,
  getCategories,
} from "@/lib/supabase/data";

// Pagina admin para editar un producto existente.
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, variants, categories, catalogNodes, brands, catalogAttributes, productAttributes] = await Promise.all([
    getAdminProductById(id),
    getAdminProductVariants(id),
    getCategories(),
    getCatalogNavigation(),
    getBrands(),
    getCatalogAttributes(),
    getAdminProductAttributes(id),
  ]);

  if (!product) notFound();

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Editar producto</h1>
        <p className="mt-1 text-muted-foreground">
          Actualiza la información de {product.name}.
        </p>
      </div>
      <ProductForm
        mode="edit"
        product={product}
        variants={variants}
        categories={categories}
        catalogNodes={catalogNodes}
        brands={Array.from(
          new Set([product.brand, ...brands.map((brand) => brand.nombre)]),
        )}
        catalogAttributes={catalogAttributes}
        initialAttributes={productAttributes}
      />
    </div>
  );
}
