"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { bankAccounts, businessConfig } from "@/data/mock-business";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AdminSettingsForm() {
  const [business, setBusiness] = useState(businessConfig);
  const [banks, setBanks] = useState(bankAccounts);
  const [shippingBase, setShippingBase] = useState(businessConfig.shippingBase);

  const save = () => {
    // TODO: Guardar configuración en Supabase con control de roles administrativos.
    toast.success("Configuración guardada en estado local mock.");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle>Datos del negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              className="mt-2"
              value={business.name}
              onChange={(event) => setBusiness({ ...business, name: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              className="mt-2"
              value={business.email}
              onChange={(event) => setBusiness({ ...business, email: event.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              className="mt-2"
              value={business.location}
              onChange={(event) => setBusiness({ ...business, location: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="schedule">Horario</Label>
            <Input
              id="schedule"
              className="mt-2"
              value={business.schedule}
              onChange={(event) => setBusiness({ ...business, schedule: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phones">Celulares</Label>
            <Input
              id="phones"
              className="mt-2"
              value={business.phones.join(", ")}
              onChange={(event) =>
                setBusiness({
                  ...business,
                  phones: event.target.value.split(",").map((item) => item.trim()),
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="maps">Google Maps iframe URL</Label>
            <Textarea
              id="maps"
              className="mt-2"
              value={business.mapsEmbedUrl}
              onChange={(event) =>
                setBusiness({ ...business, mapsEmbedUrl: event.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Costos de envío</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="shipping">Base otros productos</Label>
            <Input
              id="shipping"
              className="mt-2"
              type="number"
              step="0.01"
              value={shippingBase}
              onChange={(event) => setShippingBase(Number(event.target.value))}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Cañas usan $8.50; carretes y otros productos parten de $6.50.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuentas bancarias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {banks.map((account, index) => (
              <div key={account.id} className="rounded-lg border border-border p-3">
                <Label htmlFor={`bank-${account.id}`}>Banco</Label>
                <Input
                  id={`bank-${account.id}`}
                  className="mt-2"
                  value={account.bank}
                  onChange={(event) =>
                    setBanks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, bank: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Label htmlFor={`owner-${account.id}`} className="mt-3 block">
                  Titular
                </Label>
                <Input
                  id={`owner-${account.id}`}
                  className="mt-2"
                  value={account.owner}
                  onChange={(event) =>
                    setBanks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, owner: event.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <Button type="button" onClick={save} className="w-full">
              <Save aria-hidden="true" />
              Guardar configuración
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
