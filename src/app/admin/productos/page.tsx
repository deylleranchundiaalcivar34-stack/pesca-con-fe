import { AdminProductTable } from "@/components/admin/admin-product-table";
import { mockProducts } from "@/data/mock-products";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-dark-blue">Productos</h1>
        <p className="mt-1 text-muted-foreground">
          Busca, filtra, edita, desactiva o elimina productos en modo demo.
        </p>
      </div>
      <AdminProductTable products={mockProducts} />
    </div>
  );
}
