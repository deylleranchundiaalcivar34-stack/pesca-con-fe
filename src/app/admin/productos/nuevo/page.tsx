import { ProductForm } from "@/components/admin/formulario-producto";
import { getBrands, getCategories } from "@/lib/supabase/data";

// Pagina admin para crear un producto nuevo.
export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Crear producto</h1>
        <p className="mt-1 text-muted-foreground">
          Agrega productos, precios, stock e imágenes.
        </p>
      </div>
      <ProductForm
        mode="create"
        categories={categories}
        brands={brands.map((brand) => brand.nombre)}
      />
    </div>
  );
}
