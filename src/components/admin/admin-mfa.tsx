"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type MfaMode = "enroll" | "challenge" | "secure" | "error";
type MfaStatus = "checking" | "idle" | "enrolling" | "verifying" | "redirecting";

export function AdminMfa({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<MfaMode | null>(null);
  const [status, setStatus] = useState<MfaStatus>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setStatus("checking");
    setMessage(null);

    try {
      const supabase = createClient();
      const [aalResult, factorsResult] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

      if (aalResult.error || factorsResult.error) {
        setMode("error");
        setMessage(
          "No pudimos comprobar la verificación en dos pasos. Revisa tu conexión e inténtalo nuevamente.",
        );
        return;
      }

      if (aalResult.data.currentLevel === "aal2") {
        setMode("secure");
        return;
      }

      const verifiedFactor = factorsResult.data.totp[0];

      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
        setMode("challenge");
        return;
      }

      setMode("enroll");
    } catch {
      setMode("error");
      setMessage(
        "No pudimos comprobar la verificación en dos pasos. Revisa tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadStatus]);

  const startEnrollment = async () => {
    if (status !== "idle") return;

    setStatus("enrolling");
    setMessage(null);

    try {
      const supabase = createClient();
      const factors = await supabase.auth.mfa.listFactors();

      if (factors.error) {
        setMessage("No pudimos preparar el enrolamiento. Vuelve a intentarlo.");
        return;
      }

      const unverified = factors.data.all.filter(
        (factor) => factor.factor_type === "totp" && factor.status === "unverified",
      );
      const cleanupResults = await Promise.all(
        unverified.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
      );

      if (cleanupResults.some((result) => result.error)) {
        setMessage("No pudimos preparar el enrolamiento. Vuelve a intentarlo.");
        return;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Panel Pesca Con Fe",
      });

      if (error) {
        setMessage("No se pudo iniciar el enrolamiento. Vuelve a intentarlo.");
        return;
      }

      setFactorId(data.id);
      // Supabase entrega un SVG data URI terminado en salto de línea. Next/Image
      // rechaza fuentes que terminan en caracteres de control.
      setQrCode(data.totp.qr_code.trimEnd());
      setSecret(data.totp.secret);
    } catch {
      setMessage(
        "No pudimos comunicarnos con el servicio de verificación. Revisa tu conexión y vuelve a intentarlo.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const redirectToAdmin = async () => {
    setStatus("redirecting");
    setMessage(null);

    try {
      // Cede un turno al navegador para mostrar el estado antes de iniciar
      // la nueva petición protegida por la cookie con AAL2.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      window.location.replace(nextPath);
    } catch {
      setStatus("idle");
      setMessage("No pudimos abrir el panel. Inténtalo nuevamente.");
    }
  };

  const verify = async () => {
    if (status !== "idle") return;

    if (!factorId || !/^\d{6}$/.test(code)) {
      setMessage("Escribe el código de 6 dígitos de tu aplicación.");
      return;
    }

    setStatus("verifying");
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });

      if (error) {
        setCode("");
        setMessage("El código no es válido o expiró. Usa el código más reciente.");
        setStatus("idle");
        return;
      }

      const aalResult = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalResult.error || aalResult.data.currentLevel !== "aal2") {
        setMode("error");
        setMessage(
          "El código fue aceptado, pero no pudimos confirmar la sesión segura. Reintenta la comprobación.",
        );
        setStatus("idle");
        return;
      }

      await redirectToAdmin();
    } catch {
      setMessage(
        "No pudimos verificar el código por un problema de conexión. Vuelve a intentarlo.",
      );
      setStatus("idle");
    }
  };

  if (status === "checking") {
    return (
      <Card aria-busy="true">
        <CardContent
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 py-10 text-muted-foreground"
        >
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Comprobando protección de la cuenta…
        </CardContent>
      </Card>
    );
  }

  if (status === "verifying" || status === "redirecting") {
    const isRedirecting = status === "redirecting";

    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound aria-hidden="true" />
            Verificación en dos pasos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-secondary/60 px-6 py-10 text-center"
          >
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-dark-blue">
                {isRedirecting ? "Código confirmado. Abriendo panel…" : "Verificando código…"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isRedirecting
                  ? "La sesión segura está lista. Espera mientras cargamos el panel."
                  : "Estamos confirmando el código con tu autenticador."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === "error" || !mode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert aria-hidden="true" /> No pudimos comprobar tu sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {message}
            </p>
          ) : null}
          <Button onClick={() => void loadStatus()}>Reintentar comprobación</Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === "secure") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 aria-hidden="true" /> Sesión protegida con MFA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-emerald-900">
          <p>Esta sesión alcanzó AAL2 y puede realizar operaciones administrativas.</p>
          {nextPath !== "/admin/seguridad" ? (
            <Button onClick={() => void redirectToAdmin()}>Continuar al panel</Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-busy={status !== "idle"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "challenge" ? <KeyRound aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}
          {mode === "challenge" ? "Confirma tu segundo factor" : "Activa tu segundo factor"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {mode === "enroll" && !qrCode ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Usa una aplicación TOTP, por ejemplo Google Authenticator, Microsoft
              Authenticator o 1Password. El acceso administrativo quedará bloqueado hasta
              completar este paso.
            </p>
            <Button onClick={startEnrollment} disabled={status !== "idle"}>
              {status === "enrolling" ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {status === "enrolling" ? "Generando código QR…" : "Generar código QR"}
            </Button>
          </>
        ) : null}

        {qrCode ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escanea este código. Si no puedes, escribe manualmente la clave mostrada.
            </p>
            <div className="w-fit rounded-lg border bg-white p-3">
              <Image src={qrCode} alt="Código QR para activar MFA" width={220} height={220} unoptimized />
            </div>
            <p className="break-all rounded-md bg-secondary p-3 font-mono text-xs">{secret}</p>
          </div>
        ) : null}

        {mode === "challenge" || qrCode ? (
          <div className="space-y-3">
            <Label htmlFor="mfa-code">Código temporal</Label>
            <Input
              id="mfa-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              disabled={status !== "idle"}
            />
            <Button onClick={verify} disabled={status !== "idle" || code.length !== 6}>
              Verificar y continuar
            </Button>
          </div>
        ) : null}

        {message ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {message}
          </p>
        ) : null}

        <p className="text-xs leading-5 text-muted-foreground">
          Si pierdes el autenticador, un propietario deberá verificar tu identidad y
          restablecer el factor desde Supabase. No se debe desactivar MFA como solución
          permanente.
        </p>
      </CardContent>
    </Card>
  );
}
