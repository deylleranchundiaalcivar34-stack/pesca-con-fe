"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HCaptchaControl, isHCaptchaConfigured } from "@/components/shared/captcha-hcaptcha";
import { createClient } from "@/lib/supabase/client";

// Solicita a Supabase el enlace seguro para restablecer una contraseña.
export function PasswordRecoveryRequestForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVersion, setCaptchaVersion] = useState(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const honeypot = String(formData.get("website") ?? "").trim();
    if (honeypot) {
      setIsPending(false);
      return;
    }

    if (isHCaptchaConfigured() && !captchaToken) {
      setIsError(true);
      setMessage("Completa la verificacion de seguridad para continuar.");
      setIsPending(false);
      return;
    }

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
        captchaToken: captchaToken ?? undefined,
      });

      if (isHCaptchaConfigured()) {
        setCaptchaToken(null);
        setCaptchaVersion((version) => version + 1);
      }

      if (error) {
        setIsError(true);
        setMessage("No pudimos enviar el enlace. Intenta nuevamente en unos minutos.");
        return;
      }

      setIsError(false);
      setMessage(
        "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.",
      );
    } catch {
      setIsError(true);
      setMessage("El servicio no está disponible en este momento. Intenta nuevamente.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-primary/15 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MailCheck className="size-5 text-primary" aria-hidden="true" />
          Recuperar contraseña
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Te enviaremos un enlace seguro para crear una nueva contraseña.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {message ? (
          <p
            className={`rounded-md border p-3 text-sm ${
              isError
                ? "border-destructive/30 bg-red-50 text-destructive"
                : "border-primary/20 bg-secondary text-dark-blue"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="absolute -left-[10000px] h-px w-px overflow-hidden opacity-0" aria-hidden="true">
            <Label htmlFor="recovery-website">Sitio web</Label>
            <Input
              id="recovery-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="recovery-email">Correo electrónico</Label>
            <Input
              id="recovery-email"
              name="email"
              type="email"
              className="mt-2"
              autoComplete="off"
              required
            />
          </div>
          <HCaptchaControl key={captchaVersion} onTokenChange={setCaptchaToken} />
          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            Enviar enlace de recuperación
          </Button>
        </form>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">Volver a iniciar sesión</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
