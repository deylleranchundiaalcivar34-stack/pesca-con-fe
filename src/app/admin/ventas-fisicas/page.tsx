import { PhysicalSaleRegister } from "@/components/admin/registro-venta-fisica";
import { getAdminPhysicalSales, getAdminProducts } from "@/lib/supabase/data";

export default async function PhysicalSalesPage() {
  const [products, sales] = await Promise.all([getAdminProducts(), getAdminPhysicalSales()]);
  return <div className="space-y-6"><div><h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Venta física</h1><p className="mt-1 text-muted-foreground">Registra las ventas del local como nota de venta y descuenta el inventario al instante.</p></div><PhysicalSaleRegister products={products} sales={sales} /></div>;
}
