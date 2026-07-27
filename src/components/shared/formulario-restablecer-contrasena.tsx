"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPasswordValidationError, passwordPolicyHint } from "@/lib/seguridad-contrasena";
import { createClient } from "@/lib/supabase/client";

// Permite definir una contrasena nueva unicamente desde el enlace de Supabase.
export function PasswordResetForm() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Una sesión normal nunca habilita este formulario. Supabase emite este
    // evento únicamente al consumir el enlace de recuperación.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && event === "PASSWORD_RECOVERY") {
        setIsReady(Boolean(session));
      }

      if (mounted && event === "SIGNED_OUT") {
        setIsReady(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage("No pudimos actualizar la contraseña. Solicita un enlace nuevo.");
      setIsPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?passwordReset=1");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-primary/15 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <KeyRound className="size-5 text-primary" aria-hidden="true" />
          Nueva contraseña
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {!isReady ? (
          <div className="rounded-md border border-primary/20 bg-secondary p-3 text-sm text-dark-blue">
            Este enlace no es válido o expiró. Solicita uno nuevo para continuar.
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <div>
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                className="mt-2"
                autoComplete="off"
                minLength={8}
                aria-describedby="new-password-help"
                required
              />
              <p id="new-password-help" className="mt-2 text-xs leading-5 text-muted-foreground">
                {passwordPolicyHint}
              </p>
            </div>
            <div>
              <Label htmlFor="confirm-new-password">Confirmar contraseña</Label>
              <Input
                id="confirm-new-password"
                name="confirmPassword"
                type="password"
                className="mt-2"
                autoComplete="off"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              Guardar nueva contraseña
            </Button>
          </form>
        )}
        <Button asChild variant="ghost" className="w-full">
          <Link href="/recuperar-contrasena">Solicitar otro enlace</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
