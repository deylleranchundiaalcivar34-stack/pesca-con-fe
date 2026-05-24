import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { AdminOrderTable } from "@/components/admin/admin-order-table";
import { Button } from "@/components/ui/button";
import { mockOrders } from "@/data/mock-orders";

export default function AdminSalesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-dark-blue">Ventas y pedidos</h1>
          <p className="mt-1 text-muted-foreground">
            Confirma pagos, marca envíos y cancela pedidos con simulación de stock.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/ventas/nueva">
            <PlusCircle aria-hidden="true" />
            Nueva venta manual
          </Link>
        </Button>
      </div>
      <AdminOrderTable orders={mockOrders} />
    </div>
  );
}
