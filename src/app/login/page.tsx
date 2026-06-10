import type { Metadata } from "next";
import { ShieldCheck, ShoppingBag } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { LoginPanel } from "@/components/shared/login-panel";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Ingresa o crea tu cuenta en Pesca Con Fe para comprar más rápido.",
};

type LoginSearchParams = {
  confirmed?: string | string[];
  error?: string | string[];
  mode?: string | string[];
  redirect?: string | string[];
};

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeRedirect(value: string | string[] | undefined) {
  const redirect = getStringParam(value);

  if (!redirect?.startsWith("/admin")) {
    return "/";
  }

  return redirect;
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
  const error = getStringParam(params.error);
  const mode = getMode(params.mode);

  return (
    <PublicShell>
      <section className="bg-secondary py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[520px] flex-col justify-between bg-dark-blue p-8 text-white sm:p-10">
            <div />

            <div className="max-w-md">
              <p className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gold-light">
                <ShoppingBag className="size-4" aria-hidden="true" />
                Cuenta de cliente
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight">
                Compra más rápido en Pesca Con Fe
              </h1>
              <p className="mt-4 leading-7 text-white/75">
                Inicia sesión para autocompletar tus datos al generar un pedido.
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-white/70">
              <ShieldCheck className="size-5 text-gold" aria-hidden="true" />
              Tus datos se guardan de forma segura.
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8">
          <LoginPanel
            key={`${mode}-${confirmed ? "confirmed" : "pending"}-${error ?? "none"}`}
            confirmed={confirmed}
            error={error}
            mode={mode}
            redirectTo={getSafeRedirect(params.redirect)}
          />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
