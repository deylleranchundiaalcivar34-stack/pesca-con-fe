import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

function getSafeAdminRedirect(request: NextRequest) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return path.startsWith("/admin") ? path : "/admin";
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", getSafeAdminRedirect(request));

  if (reason) {
    url.searchParams.set("error", reason);
  }

  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  let response = NextResponse.next({
    request,
  });

  if (!isAdminRoute) {
    return response;
  }

  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    return redirectToLogin(request, "config");
  }

  const supabase = createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    return redirectToLogin(request);
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", userId)
    .eq("activo", true)
    .maybeSingle();

  if (adminError || !adminProfile) {
    return redirectToLogin(request, "unauthorized");
  }

  return response;
}
