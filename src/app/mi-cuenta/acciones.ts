"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  message?: string;
  success?: boolean;
};

export type AddressFormState = {
  message?: string;
  success?: boolean;
};

// Lee un campo de formulario como texto limpio.
function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// Devuelve Supabase y el usuario actual para acciones protegidas.
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

// Actualiza los datos personales del cliente autenticado.
export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const firstName = getText(formData, "firstName");
  const lastName = getText(formData, "lastName");

  if (!firstName || !lastName) {
    return {
      message: "Completa nombre y apellido.",
      success: false,
    };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      message: "Inicia sesión para actualizar tu perfil.",
      success: false,
    };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
    },
  });

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  }

  const { error: profileError } = await supabase
    .from("perfiles_cliente")
    .upsert(
      {
        id: user.id,
        nombres: firstName,
        apellidos: lastName,
        correo: user.email ?? "",
      },
      { onConflict: "id" },
    );

  if (profileError) {
    return {
      message: profileError.message,
      success: false,
    };
  }

  revalidatePath("/");
  revalidatePath("/mi-cuenta");

  return {
    message: "Perfil actualizado.",
    success: true,
  };
}

// Crea o actualiza una direccion de entrega del cliente.
export async function saveCustomerAddress(
  _state: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const id = getText(formData, "id");
  const alias = getText(formData, "alias") || "Dirección Principal";
  const province = getText(formData, "province");
  const city = getText(formData, "city");
  const address = getText(formData, "address");
  const deliveryReference = getText(formData, "deliveryReference");
  const contactPhone = getText(formData, "contactPhone");
  const wantsPrimary = formData.get("isPrimary") === "on";
  const isCurrentPrimary = formData.get("currentIsPrimary") === "true";

  if (!province || !city || !address) {
    return {
      message: "Completa provincia, ciudad y direccion.",
      success: false,
    };
  }

  if (address.length < 8) {
    return {
      message: "Escribe una direccion de entrega mas especifica.",
      success: false,
    };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      message: "Inicia sesion para gestionar tus direcciones.",
      success: false,
    };
  }

  const { count } = await supabase
    .from("direcciones_cliente")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", user.id)
    .eq("activa", true);
  const shouldBePrimary = wantsPrimary || isCurrentPrimary || !count;

  if (shouldBePrimary) {
    const { error: clearPrimaryError } = await supabase
      .from("direcciones_cliente")
      .update({ principal: false })
      .eq("cliente_id", user.id)
      .eq("activa", true);

    if (clearPrimaryError) {
      return {
        message: clearPrimaryError.message,
        success: false,
      };
    }
  }

  const payload = {
    cliente_id: user.id,
    alias,
    provincia: province,
    ciudad: city,
    direccion: address,
    referencia: deliveryReference || null,
    celular_contacto: contactPhone || null,
    principal: shouldBePrimary,
    activa: true,
  };

  const query = id
    ? supabase
        .from("direcciones_cliente")
        .update(payload)
        .eq("id", id)
        .eq("cliente_id", user.id)
        .select("id")
        .maybeSingle()
    : supabase
        .from("direcciones_cliente")
        .insert(payload)
        .select("id")
        .maybeSingle();

  const { data, error } = await query;

  if (error || !data) {
    return {
      message: error?.message ?? "No pudimos guardar la direccion.",
      success: false,
    };
  }

  revalidatePath("/mi-cuenta");
  revalidatePath("/checkout");

  return {
    message: id ? "Direccion actualizada." : "Direccion guardada.",
    success: true,
  };
}

// Marca una direccion como principal y desmarca las demas.
export async function setPrimaryCustomerAddress(addressId: string): Promise<AddressFormState> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      message: "Inicia sesion para gestionar tus direcciones.",
      success: false,
    };
  }

  const { data: address, error: addressError } = await supabase
    .from("direcciones_cliente")
    .select("id")
    .eq("id", addressId)
    .eq("cliente_id", user.id)
    .eq("activa", true)
    .maybeSingle();

  if (addressError || !address) {
    return {
      message: "No encontramos esa direccion.",
      success: false,
    };
  }

  const { error: clearPrimaryError } = await supabase
    .from("direcciones_cliente")
    .update({ principal: false })
    .eq("cliente_id", user.id)
    .eq("activa", true);

  if (clearPrimaryError) {
    return {
      message: clearPrimaryError.message,
      success: false,
    };
  }

  const { error } = await supabase
    .from("direcciones_cliente")
    .update({ principal: true })
    .eq("id", addressId)
    .eq("cliente_id", user.id);

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  }

  revalidatePath("/mi-cuenta");
  revalidatePath("/checkout");

  return {
    message: "Direccion principal actualizada.",
    success: true,
  };
}

// Desactiva una direccion sin borrarla fisicamente de la base de datos.
export async function deactivateCustomerAddress(addressId: string): Promise<AddressFormState> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      message: "Inicia sesion para gestionar tus direcciones.",
      success: false,
    };
  }

  const { error } = await supabase
    .from("direcciones_cliente")
    .update({ activa: false, principal: false })
    .eq("id", addressId)
    .eq("cliente_id", user.id);

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  }

  const { data: primaryAddress } = await supabase
    .from("direcciones_cliente")
    .select("id")
    .eq("cliente_id", user.id)
    .eq("activa", true)
    .eq("principal", true)
    .maybeSingle();

  if (!primaryAddress) {
    const { data: nextAddress } = await supabase
      .from("direcciones_cliente")
      .select("id")
      .eq("cliente_id", user.id)
      .eq("activa", true)
      .order("alias", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextAddress) {
      await supabase
        .from("direcciones_cliente")
        .update({ principal: true })
        .eq("id", nextAddress.id)
        .eq("cliente_id", user.id);
    }
  }

  revalidatePath("/mi-cuenta");
  revalidatePath("/checkout");

  return {
    message: "Direccion eliminada.",
    success: true,
  };
}
