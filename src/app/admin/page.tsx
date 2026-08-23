import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { AdminWelcomePromotionCard } from "@/components/admin/promocion-bienvenida-admin";
import { AdminOperationalSummary } from "@/components/admin/resumen-operativo-admin";
import { AdminSalesSummary } from "@/components/admin/resumen-ventas-admin";
import { Button } from "@/components/ui/button";
import { isLowStock, isTodayInEcuador } from "@/lib/operacion-admin";
import { WELCOME_PROMOTION } from "@/lib/promocion-bienvenida";
import { getAdminOrders, getAdminPhysicalSales, getAdminProducts } from "@/lib/supabase/data";

// Dashboard operativo: ventas filtrables, pedidos recientes e inventario a vigilar.
export default async function AdminDashboardPage() {
  const [orders, products, physicalSales] = await Promise.all([
    getAdminOrders(),
    getAdminProducts(),
    getAdminPhysicalSales(),
  ]);
  const today = new Date();
  const todayOrders = orders.filter((order) => isTodayInEcuador(order.createdAt, today));
  const welcomePromotionOrders = orders.filter(
    (order) => order.promotionCode === WELCOME_PROMOTION.code && order.discount > 0,
  );
  const lowStockProducts = products
    .filter((product) => isLowStock(product.stock))
    .sort((first, second) => first.stock - second.stock || first.name.localeCompare(second.name, "es"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Controla ventas, pagos e inventario desde un solo lugar.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/productos/nuevo">
            <PackagePlus aria-hidden="true" />
            Crear producto
          </Link>
        </Button>
      </div>

      <AdminSalesSummary orders={orders} physicalSales={physicalSales} />

      <AdminWelcomePromotionCard orders={welcomePromotionOrders} nowIso={today.toISOString()} />

      <AdminOperationalSummary orders={todayOrders} lowStockProducts={lowStockProducts} />
    </div>
  );
}
