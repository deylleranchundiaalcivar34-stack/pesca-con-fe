import { AdminOrderTable } from "@/components/admin/admin-order-table";
import { getAdminOrders } from "@/lib/supabase/data";

export default async function AdminSalesPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Ventas y pedidos</h1>
        <p className="mt-1 text-muted-foreground">
          Confirma pagos y gestiona las ventas generadas por la web.
        </p>
      </div>
      <AdminOrderTable orders={orders} />
    </div>
  );
}
