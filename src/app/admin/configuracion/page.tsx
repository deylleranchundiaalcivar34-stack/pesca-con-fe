import { bankAccounts, businessConfig } from "@/data/datos-negocio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Muestra datos comerciales y cuentas configuradas.
export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Estos datos ahora viven en el frontend para mantener la base de datos simple.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Nombre" value={businessConfig.name} />
            <Info label="Ubicación" value={`${businessConfig.location}, ${businessConfig.city}`} />
            <Info label="Horario" value={businessConfig.schedule} />
            <Info label="WhatsApp" value={businessConfig.whatsappPhoneE164} />
            <Info label="Correo" value={businessConfig.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuentas bancarias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-bold text-dark-blue">{account.bank}</p>
                <p className="mt-1 text-muted-foreground">{account.owner}</p>
                <p className="mt-1 font-medium">
                  {account.accountType}: {account.accountNumber}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Par label/valor usado en la configuracion admin.
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-dark-blue">{value}</p>
    </div>
  );
}
