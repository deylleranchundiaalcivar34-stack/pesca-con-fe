"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado.");
  }

  const { data } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!data) {
    throw new Error("No autorizado.");
  }

  return { supabase };
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getTextList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value ?? "").trim());
}

export async function saveAdminSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const phones = getText(formData, "phones")
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);

  const businessPayload = {
    nombre: getText(formData, "name"),
    direccion: getText(formData, "location"),
    ciudad: getText(formData, "city"),
    pais: getText(formData, "country") || "Ecuador",
    horario: getText(formData, "schedule"),
    telefonos: phones,
    whatsapp_e164: getText(formData, "whatsappPhoneE164"),
    correo: getText(formData, "email") || null,
    url_facebook: getText(formData, "facebook") || null,
    url_instagram: getText(formData, "instagram") || null,
    url_tiktok: getText(formData, "tiktok") || null,
    url_youtube: getText(formData, "youtube") || null,
    url_whatsapp_perfil: getText(formData, "whatsapp") || null,
    url_mapa_embed: getText(formData, "maps") || null,
    servicio_envio: getText(formData, "shippingService") || "Servientrega Ecuador",
    costo_envio_base: Number(getText(formData, "shippingBase") || 0),
    retiro_local_habilitado: formData.get("localPickupEnabled") === "on",
    instrucciones_retiro: getText(formData, "localPickupInstructions") || null,
  };

  const { data: currentConfig, error: configLookupError } = await supabase
    .from("configuracion_negocio")
    .select("id")
    .eq("activo", true)
    .order("creado_en", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (configLookupError) {
    throw new Error(configLookupError.message);
  }

  if (currentConfig) {
    const { error } = await supabase
      .from("configuracion_negocio")
      .update(businessPayload)
      .eq("id", currentConfig.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("configuracion_negocio")
      .insert({ ...businessPayload, activo: true });

    if (error) {
      throw new Error(error.message);
    }
  }

  const bankIds = getTextList(formData, "bankId");
  const banks = getTextList(formData, "bank");
  const owners = getTextList(formData, "owner");
  const cedulas = getTextList(formData, "cedula");
  const accountTypes = getTextList(formData, "accountType");
  const accountNumbers = getTextList(formData, "accountNumber");

  for (const [index, id] of bankIds.entries()) {
    if (!id) continue;

    const { error } = await supabase
      .from("cuentas_bancarias")
      .update({
        banco: banks[index] ?? "",
        titular: owners[index] ?? "",
        cedula: cedulas[index] || null,
        tipo_cuenta: accountTypes[index] || "Ahorro",
        numero_cuenta: accountNumbers[index] ?? "",
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/admin/configuracion");
}
