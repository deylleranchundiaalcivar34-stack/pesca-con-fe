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
import { HCaptchaControl, isHCaptchaConfigured } from "@/components/shared/captcha-hcaptcha";
import { notifyPublicSessionChange } from "@/lib/sesion-publica";
import { getPasswordValidationError, passwordPolicyHint } from "@/lib/seguridad-contrasena";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utilidades";
import { getPublicUserSummary } from "@/lib/usuario";

type LoginPanelProps = {
  accessMessage?: string;
  confirmed?: boolean;
  error?: string;
  mode?: "login" | "register";
  redirectTo?: string;
};

type StatusTone = "info" | "error";

// Traduce errores tecnicos de Supabase a mensajes claros para el cliente.
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

  if (normalized.includes("database error saving new user")) {
    return "No pudimos crear la cuenta. Intenta nuevamente.";
  }

  return "No pudimos completar la solicitud. Revisa los datos e intenta nuevamente.";
}

// Convierte errores de ruta en mensajes visibles del formulario.
function getRouteErrorMessage(error?: string) {
  if (error === "config") {
    return "El inicio de sesión no está disponible en este momento.";
  }

  if (error === "unauthorized") {
    return "Tu cuenta no tiene acceso administrativo.";
  }

  return null;
}

// Intenta crear el cliente Supabase y devuelve un mensaje si falta configuracion.
function getSupabaseClientOrMessage() {
  try {
    return { supabase: createClient(), error: null };
  } catch {
    return { supabase: null, error: getRouteErrorMessage("config") };
  }
}

// Maneja login y registro con Supabase desde una misma interfaz.
export function LoginPanel({
  accessMessage,
  confirmed = false,
  error,
  mode = "login",
  redirectTo = "/",
}: LoginPanelProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [loginCaptchaToken, setLoginCaptchaToken] = useState<string | null>(null);
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState<string | null>(null);
  const [loginCaptchaVersion, setLoginCaptchaVersion] = useState(0);
  const [registerCaptchaVersion, setRegisterCaptchaVersion] = useState(0);
  const routeErrorMessage = getRouteErrorMessage(error);
  const initialStatusMessage = confirmed
    ? ["Correo confirmado. Ya puedes iniciar sesión.", accessMessage]
        .filter(Boolean)
        .join(" ")
    : routeErrorMessage ?? accessMessage ?? null;
  const [statusMessage, setStatusMessage] = useState<string | null>(
    initialStatusMessage,
  );
  const [statusTone, setStatusTone] = useState<StatusTone>(
    routeErrorMessage ? "error" : "info",
  );

  const showStatus = (message: string | null, tone: StatusTone = "error") => {
    setStatusTone(tone);
    setStatusMessage(message);
  };
  const redirectQuery =
    redirectTo === "/" ? "" : `&redirect=${encodeURIComponent(redirectTo)}`;
  const captchaIsRequired = isHCaptchaConfigured();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setStatusMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (captchaIsRequired && !loginCaptchaToken) {
      setIsPending(false);
      showStatus("Completa la verificacion de seguridad para continuar.");
      return;
    }

    const { supabase, error: configError } = getSupabaseClientOrMessage();

    if (!supabase) {
      setIsPending(false);
      showStatus(configError);
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: loginCaptchaToken ?? undefined },
    });

    if (captchaIsRequired) {
      setLoginCaptchaToken(null);
      setLoginCaptchaVersion((version) => version + 1);
    }
    setIsPending(false);

    if (signInError) {
      showStatus(getAuthErrorMessage(signInError.message));
      return;
    }

    toast.success("Sesión iniciada");
    notifyPublicSessionChange(
      signInData.user ? getPublicUserSummary(signInData.user) : undefined,
    );
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
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const honeypot = String(formData.get("website") ?? "").trim();

    if (honeypot) {
      setIsPending(false);
      showStatus("No pudimos completar el registro. Intenta nuevamente.");
      return;
    }

    if (captchaIsRequired && !registerCaptchaToken) {
      setIsPending(false);
      showStatus("Completa la verificacion de seguridad para continuar.");
      return;
    }

    if (password !== confirmPassword) {
      setIsPending(false);
      showStatus("Las contraseñas no coinciden.");
      return;
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setIsPending(false);
      showStatus(passwordError);
      return;
    }

    const { supabase, error: configError } = getSupabaseClientOrMessage();

    if (!supabase) {
      setIsPending(false);
      showStatus(configError);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: registerCaptchaToken ?? undefined,
        emailRedirectTo: `${window.location.origin}/login?confirmed=1${redirectQuery}`,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
      },
    });

    if (captchaIsRequired) {
      setRegisterCaptchaToken(null);
      setRegisterCaptchaVersion((version) => version + 1);
    }
    setIsPending(false);

    if (signUpError) {
      const normalizedError = signUpError.message.toLowerCase();
      const couldRevealExistingEmail =
        normalizedError.includes("already") ||
        normalizedError.includes("registered") ||
        normalizedError.includes("exists");

      showStatus(
        couldRevealExistingEmail
          ? "Si el correo puede registrarse, recibirás un mensaje para continuar."
          : getAuthErrorMessage(signUpError.message),
        couldRevealExistingEmail ? "info" : "error",
      );
      return;
    }

    // La respuesta es deliberadamente idéntica para un correo nuevo y uno ya
    // registrado, evitando que el formulario funcione como enumerador de cuentas.
    showStatus(
      "Si el correo puede registrarse, recibirás un mensaje para continuar.",
      "info",
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
        {!isLogin ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Crea tu perfil para que tus compras sean más rápidas.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {statusMessage ? (
            <div
              className={cn(
                "rounded-md border p-3 text-sm",
                statusTone === "error"
                  ? "!border-destructive/30 bg-red-50 text-destructive"
                  : "border-primary/20 bg-secondary text-dark-blue",
              )}
            >
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
              <HCaptchaControl key={loginCaptchaVersion} onTokenChange={setLoginCaptchaToken} />
              <Button asChild variant="link" className="h-auto justify-start px-0 text-sm">
                <Link href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
              </Button>
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                Ingresar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="absolute -left-[10000px] h-px w-px overflow-hidden opacity-0" aria-hidden="true">
                <Label htmlFor="register-website">Sitio web</Label>
                <Input
                  id="register-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
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
                  minLength={8}
                  aria-describedby="register-password-help"
                  required
                />
                <p id="register-password-help" className="mt-2 text-xs leading-5 text-muted-foreground">
                  {passwordPolicyHint}
                </p>
              </div>
              <div>
                <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  className="mt-2"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <HCaptchaControl key={registerCaptchaVersion} onTokenChange={setRegisterCaptchaToken} />
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                <UserPlus aria-hidden="true" />
                Crear cuenta
              </Button>
            </form>
          )}

          <div className="rounded-md bg-secondary p-3 text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <Button asChild variant="link" className="h-auto p-0 font-bold">
              <Link
                href={
                  isLogin
                    ? `/login?mode=register${redirectQuery}`
                    : `/login${redirectTo === "/" ? "" : `?redirect=${encodeURIComponent(redirectTo)}`}`
                }
              >
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
