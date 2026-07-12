import { CatalogManager } from "@/components/admin/gestor-catalogo";
import { getAdminCatalogNodes } from "@/lib/supabase/data";

// Pagina admin para gestionar la arquitectura jerarquica del catalogo.
export default async function AdminCatalogPage() {
  const nodes = await getAdminCatalogNodes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Catalogo</h1>
        <p className="mt-1 text-muted-foreground">
          Organiza el menu de productos y edita cada pagina de categoria.
        </p>
      </div>
      <CatalogManager nodes={nodes} />
    </div>
  );
}
