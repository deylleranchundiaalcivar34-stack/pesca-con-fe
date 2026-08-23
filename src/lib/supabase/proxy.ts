import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AdminPermission } from "@/lib/admin-permissions";
import { hasAdminPermission, isAdminRole } from "@/lib/admin-permissions";
import { getSupabaseEnv } from "./env";

type SessionCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

type SessionResponseState = {
  cookies: SessionCookie[];
  headers: Record<string, string>;
};

const sessionRoutePrefixes = [
  "/admin",
  "/auth",
  "/checkout",
  "/login",
  "/mi-cuenta",
  "/recuperar-contrasena",
  "/restablecer-contrasena",
  "/api/sesion",
];

export function shouldRefreshSupabaseSession(pathname: string) {
  return sessionRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function applySessionState(response: NextResponse, state: SessionResponseState) {
  state.cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  Object.entries(state.headers).forEach(([name, value]) => {
    response.headers.set(name, value);
  });

  return response;
}

function requiredPermission(pathname: string): AdminPermission {
  if (pathname.startsWith("/admin/productos") || pathname.startsWith("/admin/marcas")) {
    return "catalog.write";
  }

  if (pathname.startsWith("/admin/pedidos")) return "orders.read";
  if (pathname.startsWith("/admin/inventario")) return "inventory.export";
  return "dashboard.read";
}

// Evita redirecciones abiertas al volver al admin despues del login.
function getSafeAdminRedirect(request: NextRequest) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return path.startsWith("/admin") ? path : "/admin";
}

// Envia al login con una razon opcional y redirect interno seguro.
function redirectToLogin(
  request: NextRequest,
  sessionState: SessionResponseState,
  reason?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", getSafeAdminRedirect(request));

  if (reason) {
    url.searchParams.set("error", reason);
  }

  return applySessionState(NextResponse.redirect(url), sessionState);
}

// Actualiza cookies de sesion y protege rutas administrativas.
export async function updateSession(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const mustRefreshSession = shouldRefreshSupabaseSession(request.nextUrl.pathname);
  const sessionState: SessionResponseState = { cookies: [], headers: {} };
  let response = NextResponse.next({
    request,
  });

  if (!mustRefreshSession) {
    return response;
  }

  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    return isAdminRoute
      ? redirectToLogin(request, sessionState, "config")
      : response;
  }

  const supabase = createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          sessionState.cookies = cookiesToSet;
          sessionState.headers = headers;

          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = applySessionState(
            NextResponse.next({
              request,
            }),
            sessionState,
          );
        },
      },
    },
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    return isAdminRoute
      ? redirectToLogin(request, sessionState)
      : response;
  }

  if (!isAdminRoute) {
    return response;
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("perfiles_admin")
    .select("id, rol")
    .eq("id", userId)
    .eq("activo", true)
    .maybeSingle();

  if (adminError || !adminProfile || !isAdminRole(adminProfile.rol)) {
    return redirectToLogin(request, sessionState, "unauthorized");
  }

  const isSecurityRoute = request.nextUrl.pathname.startsWith("/admin/seguridad");
  const aal = claimsData.claims.aal;

  if (!isSecurityRoute && aal !== "aal2") {
    const securityUrl = request.nextUrl.clone();
    securityUrl.pathname = "/admin/seguridad";
    securityUrl.search = "";
    securityUrl.searchParams.set("next", getSafeAdminRedirect(request));
    return applySessionState(NextResponse.redirect(securityUrl), sessionState);
  }

  if (
    !isSecurityRoute &&
    !hasAdminPermission(adminProfile.rol, requiredPermission(request.nextUrl.pathname))
  ) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/admin";
    homeUrl.search = "";

    if (homeUrl.pathname === request.nextUrl.pathname) {
      return redirectToLogin(request, sessionState, "unauthorized");
    }

    return applySessionState(NextResponse.redirect(homeUrl), sessionState);
  }

  return response;
}
