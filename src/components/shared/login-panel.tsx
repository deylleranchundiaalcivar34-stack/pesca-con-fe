"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEcuadorianCedula } from "@/lib/ecuador";
import { createClient } from "@/lib/supabase/client";

type LoginPanelProps = {
  confirmed?: boolean;
  error?: string;
  mode?: "login" | "register";
  redirectTo?: string;
};

function getAuthErrorMessage(message?: string) {
  if (!message) return "No pudimos completar la solicitud.";

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("already registered")
  ) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }

  return message;
}

function isExistingEmailSignUp(dataUser?: { identities?: unknown[] } | null) {
  return Boolean(dataUser && Array.isArray(dataUser.identities) && dataUser.identities.length === 0);
}

function getRouteErrorMessage(error?: string) {
  if (error === "config") {
    return "El inicio de sesión no está disponible en este momento.";
  }

  if (error === "unauthorized") {
    return "Tu cuenta no tiene acceso administrativo.";
  }

  return null;
}

function getSupabaseClientOrMessage() {
  try {
    return { supabase: createClient(), error: null };
  } catch {
    return { supabase: null, error: getRouteErrorMessage("config") };
  }
}

export function LoginPanel({
  confirmed = false,
  error,
  mode = "login",
  redirectTo = "/",
}: LoginPanelProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    confirmed ? "Correo confirmado. Ya puedes iniciar sesión." : getRouteErrorMessage(error),
  );

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setStatusMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const { supabase, error: configError } = getSupabaseClientOrMessage();

    if (!supabase) {
      setIsPending(false);
      setStatusMessage(configError);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsPending(false);

    if (signInError) {
      setStatusMessage(getAuthErrorMessage(signInError.message));
      return;
    }

    toast.success("Sesión iniciada");
    router.push(redirectTo);
    router.refresh();
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setStatusMessage(null);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const cedula = String(formData.get("cedula") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!isValidEcuadorianCedula(cedula)) {
      setIsPending(false);
      setStatusMessage("Ingresa una cédula ecuatoriana válida.");
      return;
    }

    const { supabase, error: configError } = getSupabaseClientOrMessage();

    if (!supabase) {
      setIsPending(false);
      setStatusMessage(configError);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone,
          cedula,
        },
      },
    });

    setIsPending(false);

    if (signUpError) {
      setStatusMessage(getAuthErrorMessage(signUpError.message));
      return;
    }

    if (isExistingEmailSignUp(data.user)) {
      setStatusMessage("Este correo ya está registrado. Intenta iniciar sesión.");
      return;
    }

    if (data.session) {
      const { error: profileError } = await supabase
        .from("perfiles_cliente")
        .upsert(
          {
            id: data.session.user.id,
            nombres: firstName,
            apellidos: lastName,
            cedula,
            celular: phone,
            correo: email,
          },
          { onConflict: "id" },
        );

      if (profileError) {
        setIsPending(false);
        setStatusMessage(profileError.message);
        return;
      }

      toast.success("Cuenta creada");
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setStatusMessage(
      "Registro creado. Revisa tu correo para confirmar la cuenta. Tus datos se usarán para agilizar el checkout.",
    );
  };

  const isLogin = mode === "login";

  return (
    <Card className="w-full max-w-lg border-primary/15 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-2xl">
          {isLogin ? (
            <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
          ) : (
            <UserPlus className="size-5 text-primary" aria-hidden="true" />
          )}
          {isLogin ? "Ingresar" : "Crear cuenta"}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          {isLogin
            ? "Entra para usar tus datos guardados en el checkout."
            : "Crea tu perfil para que tus compras sean más rápidas."}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {statusMessage ? (
            <div className="rounded-md border border-primary/20 bg-secondary p-3 text-sm text-dark-blue">
              {statusMessage}
            </div>
          ) : null}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Correo</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  className="mt-2"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  className="mt-2"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                Ingresar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="register-first-name">Nombre</Label>
                  <Input
                    id="register-first-name"
                    name="firstName"
                    className="mt-2"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-last-name">Apellido</Label>
                  <Input
                    id="register-last-name"
                    name="lastName"
                    className="mt-2"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="register-cedula">Cédula</Label>
                <Input
                  id="register-cedula"
                  name="cedula"
                  className="mt-2"
                  autoComplete="off"
                  inputMode="numeric"
                  minLength={10}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-phone">Celular</Label>
                <Input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  className="mt-2"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-email">Correo</Label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  className="mt-2"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password">Contraseña</Label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  className="mt-2"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                <UserPlus aria-hidden="true" />
                Crear cuenta
              </Button>
            </form>
          )}

          <div className="rounded-md bg-secondary p-3 text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <Button asChild variant="link" className="h-auto p-0 font-bold">
              <Link href={isLogin ? "/login?mode=register" : "/login"}>
                {isLogin ? "Crear cuenta" : "Ingresar"}
              </Link>
            </Button>
          </div>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Volver a la tienda</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
