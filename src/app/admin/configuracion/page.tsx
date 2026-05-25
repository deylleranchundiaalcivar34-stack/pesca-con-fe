import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { getBankAccounts, getBusinessConfig } from "@/lib/supabase/data";

export default async function AdminSettingsPage() {
  const [business, bankAccounts] = await Promise.all([
    getBusinessConfig(),
    getBankAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Datos del negocio, cuentas bancarias, redes, horario y costos de envío.
        </p>
      </div>
      <AdminSettingsForm business={business} bankAccounts={bankAccounts} />
    </div>
  );
}
