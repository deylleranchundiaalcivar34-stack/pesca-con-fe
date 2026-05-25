import type { ReactNode } from "react";
import { Save } from "lucide-react";
import { saveAdminSettings } from "@/app/admin/configuracion/actions";
import type { BankAccount, BusinessConfig } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdminSettingsFormProps {
  business: BusinessConfig;
  bankAccounts: BankAccount[];
}

export function AdminSettingsForm({
  business,
  bankAccounts,
}: AdminSettingsFormProps) {
  return (
    <form action={saveAdminSettings} className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del negocio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Nombre">
              <Input id="name" name="name" defaultValue={business.name} required />
            </Field>
            <Field id="email" label="Correo">
              <Input id="email" name="email" type="email" defaultValue={business.email} />
            </Field>
            <Field id="location" label="Ubicación" className="sm:col-span-2">
              <Input id="location" name="location" defaultValue={business.location} required />
            </Field>
            <Field id="city" label="Ciudad">
              <Input id="city" name="city" defaultValue={business.city} required />
            </Field>
            <Field id="country" label="País">
              <Input id="country" name="country" defaultValue={business.country} required />
            </Field>
            <Field id="schedule" label="Horario">
              <Input id="schedule" name="schedule" defaultValue={business.schedule} />
            </Field>
            <Field id="phones" label="Celulares">
              <Input id="phones" name="phones" defaultValue={business.phones.join(", ")} />
            </Field>
            <Field id="whatsappPhoneE164" label="WhatsApp E.164">
              <Input
                id="whatsappPhoneE164"
                name="whatsappPhoneE164"
                defaultValue={business.whatsappPhoneE164}
                required
              />
            </Field>
            <Field id="shippingService" label="Servicio de envío">
              <Input
                id="shippingService"
                name="shippingService"
                defaultValue={business.shippingService}
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retiro y envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="shippingBase" label="Base otros productos">
              <Input
                id="shippingBase"
                name="shippingBase"
                type="number"
                step="0.01"
                min="0"
                defaultValue={business.shippingBase}
                required
              />
            </Field>
            <div className="flex items-center gap-3 rounded-md border border-border p-3">
              <input
                id="localPickupEnabled"
                name="localPickupEnabled"
                type="checkbox"
                defaultChecked={business.localPickupEnabled}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="localPickupEnabled">Retiro local habilitado</Label>
            </div>
            <Field id="localPickupInstructions" label="Instrucciones de retiro">
              <Textarea
                id="localPickupInstructions"
                name="localPickupInstructions"
                defaultValue={business.localPickupInstructions}
                className="min-h-28"
              />
            </Field>
            <Field id="maps" label="Google Maps iframe URL">
              <Textarea
                id="maps"
                name="maps"
                defaultValue={business.mapsEmbedUrl}
                className="min-h-28"
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Redes sociales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Field id="facebook" label="Facebook">
              <Input id="facebook" name="facebook" defaultValue={business.social.facebook} />
            </Field>
            <Field id="instagram" label="Instagram">
              <Input id="instagram" name="instagram" defaultValue={business.social.instagram} />
            </Field>
            <Field id="tiktok" label="TikTok">
              <Input id="tiktok" name="tiktok" defaultValue={business.social.tiktok} />
            </Field>
            <Field id="youtube" label="YouTube">
              <Input id="youtube" name="youtube" defaultValue={business.social.youtube} />
            </Field>
            <Field id="whatsapp" label="Link de WhatsApp">
              <Input id="whatsapp" name="whatsapp" defaultValue={business.social.whatsapp} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuentas bancarias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {bankAccounts.map((account) => (
                <div key={account.id} className="rounded-lg border border-border p-3">
                  <input type="hidden" name="bankId" value={account.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id={`bank-${account.id}`} label="Banco">
                      <Input
                        id={`bank-${account.id}`}
                        name="bank"
                        defaultValue={account.bank}
                        required
                      />
                    </Field>
                    <Field id={`account-type-${account.id}`} label="Tipo">
                      <select
                        id={`account-type-${account.id}`}
                        name="accountType"
                        defaultValue={account.accountType}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="Ahorro">Ahorro</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    </Field>
                    <Field id={`owner-${account.id}`} label="Titular" className="sm:col-span-2">
                      <Input
                        id={`owner-${account.id}`}
                        name="owner"
                        defaultValue={account.owner}
                        required
                      />
                    </Field>
                    <Field id={`cedula-${account.id}`} label="Cédula">
                      <Input
                        id={`cedula-${account.id}`}
                        name="cedula"
                        defaultValue={account.cedula ?? ""}
                      />
                    </Field>
                    <Field id={`account-number-${account.id}`} label="Número de cuenta">
                      <Input
                        id={`account-number-${account.id}`}
                        name="accountNumber"
                        defaultValue={account.accountNumber}
                        required
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full">
              <Save aria-hidden="true" />
              Guardar configuración
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
