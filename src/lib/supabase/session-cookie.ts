interface NamedCookie {
  name: string;
}

/** Detecta la cookie de autenticación sin leer ni exponer su contenido. */
export function hasSupabaseAuthCookie(cookies: readonly NamedCookie[]) {
  return cookies.some(
    ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
  );
}
