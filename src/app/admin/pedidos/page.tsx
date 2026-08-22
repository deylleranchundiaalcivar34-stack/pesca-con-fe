import { AdminOrderTable } from "@/components/admin/tabla-pedidos-admin";
import { resolveSelectedOrderId } from "@/lib/operacion-admin";
import { getAdminOrders } from "@/lib/supabase/data";

interface AdminOrdersPageProps {
  searchParams: Promise<{ pedido?: string | string[] }>;
}

// Pagina admin que carga pedidos y los entrega a la tabla.
export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const ordersPromise = getAdminOrders();
  const requestedOrder = (await searchParams).pedido;
  const orders = await ordersPromise;
  const initialExpandedOrderId = resolveSelectedOrderId(
    requestedOrder,
    orders.map((order) => order.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Pedidos</h1>
        <p className="mt-1 text-muted-foreground">
          Confirma pagos y gestiona los pedidos generados por la web.
        </p>
      </div>
      <AdminOrderTable orders={orders} initialExpandedOrderId={initialExpandedOrderId} />
    </div>
  );
}
