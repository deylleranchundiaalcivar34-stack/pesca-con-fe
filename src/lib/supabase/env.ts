// Normaliza la URL de Supabase para evitar barras finales duplicadas.
function normalizeSupabaseUrl(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
    return trimmedValue;
  }

  return `https://${trimmedValue}.supabase.co`;
}

// Lee variables publicas de Supabase desde el entorno.
export function getSupabaseEnv() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

// Permite renderizar fallbacks cuando Supabase no esta configurado.
export function hasSupabaseEnv() {
  return Boolean(getSupabaseEnv());
}
