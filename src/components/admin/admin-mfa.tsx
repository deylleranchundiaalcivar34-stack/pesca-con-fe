"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type MfaMode = "loading" | "enroll" | "challenge" | "secure";

export function AdminMfa({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<MfaMode>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loadStatus = useCallback(async () => {
    const supabase = createClient();
    const [aalResult, factorsResult] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);

    if (aalResult.error || factorsResult.error) {
      setMessage("No pudimos comprobar la verificación en dos pasos.");
      setMode("enroll");
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
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadStatus]);

  const startEnrollment = async () => {
    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const factors = await supabase.auth.mfa.listFactors();

    if (!factors.error) {
      const unverified = factors.data.all.filter(
        (factor) => factor.factor_type === "totp" && factor.status === "unverified",
      );
      await Promise.all(
        unverified.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
      );
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Panel Pesca Con Fe",
    });
    setPending(false);

    if (error) {
      setMessage("No se pudo iniciar el enrolamiento. Vuelve a intentarlo.");
      return;
    }

    setFactorId(data.id);
    // Supabase entrega un SVG data URI terminado en salto de línea. Next/Image
    // rechaza fuentes que terminan en caracteres de control.
    setQrCode(data.totp.qr_code.trimEnd());
    setSecret(data.totp.secret);
  };

  const verify = async () => {
    if (!factorId || !/^\d{6}$/.test(code)) {
      setMessage("Escribe el código de 6 dígitos de tu aplicación.");
      return;
    }

    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setPending(false);

    if (error) {
      setCode("");
      setMessage("El código no es válido o expiró. Usa el código más reciente.");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  };

  if (mode === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Comprobando protección de la cuenta…
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
            <Button onClick={() => router.replace(nextPath)}>Continuar al panel</Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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
            <Button onClick={startEnrollment} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Generar código QR
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
            />
            <Button onClick={verify} disabled={pending || code.length !== 6}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
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
