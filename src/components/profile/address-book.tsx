"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { CheckCircle2, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  deactivateCustomerAddress,
  saveCustomerAddress,
  setPrimaryCustomerAddress,
  type AddressFormState,
} from "@/app/mi-perfil/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerAddress } from "@/types/customer";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      <CheckCircle2 aria-hidden="true" />
      {label}
    </Button>
  );
}

function AddressForm({
  address,
  onCancel,
}: {
  address?: CustomerAddress;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [state, action] = useActionState<AddressFormState, FormData>(
    saveCustomerAddress,
    {},
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      router.refresh();
      onCancel?.();
      return;
    }

    toast.error(state.message);
  }, [onCancel, router, state]);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      {address ? (
        <input type="hidden" name="currentIsPrimary" value={String(address.isPrimary)} />
      ) : null}
      <div>
        <Label htmlFor={address ? `alias-${address.id}` : "alias-new"}>Alias</Label>
        <Input
          id={address ? `alias-${address.id}` : "alias-new"}
          name="alias"
          className="mt-2"
          defaultValue={address?.alias ?? "Dirección Principal"}
          placeholder="Casa, trabajo, oficina"
          required
        />
      </div>
      <div>
        <Label htmlFor={address ? `phone-${address.id}` : "phone-new"}>Celular de contacto</Label>
        <Input
          id={address ? `phone-${address.id}` : "phone-new"}
          name="contactPhone"
          type="tel"
          className="mt-2"
          defaultValue={address?.contactPhone ?? ""}
          autoComplete="tel"
        />
      </div>
      <div>
        <Label htmlFor={address ? `province-${address.id}` : "province-new"}>Provincia</Label>
        <Input
          id={address ? `province-${address.id}` : "province-new"}
          name="province"
          className="mt-2"
          defaultValue={address?.province ?? ""}
          autoComplete="address-level1"
          required
        />
      </div>
      <div>
        <Label htmlFor={address ? `city-${address.id}` : "city-new"}>Ciudad</Label>
        <Input
          id={address ? `city-${address.id}` : "city-new"}
          name="city"
          className="mt-2"
          defaultValue={address?.city ?? ""}
          autoComplete="address-level2"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={address ? `address-${address.id}` : "address-new"}>Direccion</Label>
        <Input
          id={address ? `address-${address.id}` : "address-new"}
          name="address"
          className="mt-2"
          defaultValue={address?.address ?? ""}
          autoComplete="street-address"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={address ? `reference-${address.id}` : "reference-new"}>
          Referencia de entrega
        </Label>
        <Textarea
          id={address ? `reference-${address.id}` : "reference-new"}
          name="deliveryReference"
          className="mt-2"
          defaultValue={address?.deliveryReference ?? ""}
          placeholder="Casa esquinera, local comercial o punto cercano."
        />
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-dark-blue sm:col-span-2">
        <input
          type="checkbox"
          name="isPrimary"
          defaultChecked={address?.isPrimary ?? false}
          className="size-4 rounded border-border"
        />
        Usar como direccion principal
      </label>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
        <SubmitButton label={address ? "Guardar direccion" : "Agregar direccion"} />
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: CustomerAddress[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAddressAction = (
    action: () => Promise<AddressFormState>,
    fallbackMessage: string,
  ) => {
    startTransition(async () => {
      const result = await action();

      if (result.success) {
        toast.success(result.message ?? fallbackMessage);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "No pudimos actualizar la direccion.");
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" aria-hidden="true" />
            Nueva direccion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {addresses.length ? (
          addresses.map((address) => {
            const isEditing = editingId === address.id;

            return (
              <Card key={address.id}>
                <CardContent className="p-5">
                  {isEditing ? (
                    <AddressForm address={address} onCancel={() => setEditingId(null)} />
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-dark-blue">{address.alias}</h3>
                          {address.isPrimary ? <Badge>Principal</Badge> : null}
                        </div>
                        <p className="mt-2 flex gap-2 text-sm leading-6 text-muted-foreground">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                          <span>
                            {address.address}, {address.city}, {address.province}
                          </span>
                        </p>
                        {address.deliveryReference ? (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {address.deliveryReference}
                          </p>
                        ) : null}
                        {address.contactPhone ? (
                          <p className="mt-2 text-sm font-semibold text-dark-blue">
                            {address.contactPhone}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!address.isPrimary ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              runAddressAction(
                                () => setPrimaryCustomerAddress(address.id),
                                "Direccion principal actualizada.",
                              )
                            }
                          >
                            <Star aria-hidden="true" />
                            Principal
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(address.id)}
                        >
                          <Pencil aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            runAddressAction(
                              () => deactivateCustomerAddress(address.id),
                              "Direccion eliminada.",
                            )
                          }
                        >
                          <Trash2 aria-hidden="true" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <MapPin className="mx-auto size-12 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-black text-dark-blue">No tienes direcciones</h3>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Agrega una direccion para acelerar tus proximas compras.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
