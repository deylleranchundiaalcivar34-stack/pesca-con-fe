"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateProfile, type ProfileFormState } from "@/app/mi-cuenta/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicUserSummary } from "@/types/usuario";

// Boton que refleja el estado pendiente del formulario de perfil.
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      Guardar cambios
    </Button>
  );
}

// Permite editar los datos principales del cliente autenticado.
export function ProfileForm({ user }: { user: PublicUserSummary }) {
  const router = useRouter();
  const initialState: ProfileFormState = {};
  const [state, action] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      router.refresh();
      return;
    }

    toast.error(state.message);
  }, [router, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información personal</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              name="firstName"
              className="mt-2"
              defaultValue={user.firstName ?? ""}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              name="lastName"
              className="mt-2"
              defaultValue={user.lastName ?? ""}
              autoComplete="family-name"
              required
            />
          </div>
          <div>
            <Label htmlFor="cedula">Cédula ecuatoriana</Label>
            <Input
              id="cedula"
              name="cedula"
              className="mt-2"
              defaultValue={user.cedula ?? ""}
              autoComplete="off"
              inputMode="numeric"
              maxLength={10}
              minLength={10}
              pattern="[0-9]{10}"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Celular</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              className="mt-2"
              defaultValue={user.phone ?? ""}
              autoComplete="tel"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              className="mt-2"
              value={user.email ?? ""}
              disabled
              readOnly
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Para cambiar tu correo, contacta a Pesca Con Fe.
            </p>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
