import { InventoryExporter } from "@/components/admin/exportador-inventario";
import { getAdminProducts } from "@/lib/supabase/data";

export default async function InventoryPage() {
  const products = await getAdminProducts();
  return <div className="space-y-6"><div><h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Exportar inventario</h1><p className="mt-1 text-muted-foreground">Descarga el inventario actualizado para abrirlo directamente en Excel.</p></div><InventoryExporter products={products} /></div>;
}
