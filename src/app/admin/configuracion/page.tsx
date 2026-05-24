import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-dark-blue">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Datos del negocio, cuentas bancarias, redes, horario y costos de envío.
        </p>
      </div>
      <AdminSettingsForm />
    </div>
  );
}
