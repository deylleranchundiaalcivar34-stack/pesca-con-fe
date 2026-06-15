import { AdminProductTable } from "@/components/admin/tabla-productos-admin";
import { getAdminProducts } from "@/lib/supabase/data";

// Pagina admin que carga productos para gestionarlos.
export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Productos</h1>
        <p className="mt-1 text-muted-foreground">
          Busca, filtra, edita, desactiva u oculta productos.
        </p>
      </div>
      <AdminProductTable products={products} />
    </div>
  );
}
