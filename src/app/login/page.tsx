import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { LoginPanel } from "@/components/shared/panel-inicio-sesion";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Ingresa o crea tu cuenta en Pesca Con Fe para comprar más rápido.",
};

type LoginSearchParams = {
  confirmed?: string | string[];
  error?: string | string[];
  mode?: string | string[];
  passwordReset?: string | string[];
  redirect?: string | string[];
};

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeRedirect(value: string | string[] | undefined) {
  const redirect = getStringParam(value);

  if (
    redirect === "/checkout" ||
    redirect === "/preguntas-frecuentes#hacer-pregunta" ||
    redirect?.startsWith("/admin")
  ) {
    return redirect;
  }

  return "/";
}

function getAccessMessage(redirectTo: string) {
  if (redirectTo === "/checkout") {
    return "Debes iniciar sesión para generar tu pedido.";
  }

  if (redirectTo === "/preguntas-frecuentes#hacer-pregunta") {
    return "Debes iniciar sesión para enviar tu pregunta.";
  }

  return undefined;
}

function getMode(value: string | string[] | undefined) {
  return getStringParam(value) === "register" ? "register" : "login";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const confirmed = getStringParam(params.confirmed) === "1";
  const passwordReset = getStringParam(params.passwordReset) === "1";
  const error = getStringParam(params.error);
  const mode = getMode(params.mode);
  const redirectTo = getSafeRedirect(params.redirect);

  return (
    <PublicShell>
      <section className="bg-secondary py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bg-dark-blue p-8 text-white sm:p-10">
            <Image
              src="/images/fotos/foto-cuadrada1.webp"
              alt="Pesca deportiva en la Amazonía"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 45vw"
              className="object-cover object-left"
            />
            <div className="absolute inset-0 bg-dark-blue/45" aria-hidden="true" />
            <div
              className="absolute inset-0 bg-gradient-to-t from-dark-blue/70 via-dark-blue/35 to-dark-blue/15"
              aria-hidden="true"
            />

            <div className="relative z-10 max-w-md">
              <h1 className="text-4xl font-black leading-tight text-gold-light sm:text-5xl">
                Bienvenido a Pesca Con Fe
              </h1>
              <p className="mt-4 leading-7 text-white/85">
                {"Tu equipo para cada aventura de pesca comienza aquí."}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 text-sm text-white/85">
              <ShieldCheck className="size-5 text-gold" aria-hidden="true" />
              Tus datos se guardan de forma segura.
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8">
            <LoginPanel
              key={`${mode}-${confirmed ? "confirmed" : "pending"}-${passwordReset ? "password-reset" : "none"}-${error ?? "none"}-${redirectTo}`}
              accessMessage={
                passwordReset
                  ? "Contraseña actualizada. Ya puedes iniciar sesión."
                  : getAccessMessage(redirectTo)
              }
              confirmed={confirmed}
              error={error}
              mode={mode}
              redirectTo={redirectTo}
            />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
