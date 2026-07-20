"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSameCustomerAddress } from "@/lib/direcciones-cliente";
import { reportServerError } from "@/lib/safe-server-error";

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

  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
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
    reportServerError("Customer auth profile update failed", error);
    return {
      message: "No pudimos actualizar el perfil. Intenta nuevamente.",
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
    reportServerError("Customer database profile update failed", profileError);
    return {
      message: "No pudimos guardar el perfil. Intenta nuevamente.",
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

  if (
    !province ||
    !city ||
    !address ||
    alias.length > 80 ||
    province.length > 100 ||
    city.length > 100 ||
    address.length > 500 ||
    deliveryReference.length > 500 ||
    contactPhone.length > 30
  ) {
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

  const { data: activeAddresses, error: activeAddressesError } = await supabase
    .from("direcciones_cliente")
    .select("id, provincia, ciudad, direccion, referencia, celular_contacto, principal")
    .eq("cliente_id", user.id)
    .eq("activa", true);

  if (activeAddressesError) {
    reportServerError("Customer address lookup failed", activeAddressesError);
    return {
      message: "No pudimos revisar tus direcciones. Intenta nuevamente.",
      success: false,
    };
  }

  const matchingAddress = activeAddresses?.find(
    (savedAddress) =>
      savedAddress.id !== id &&
      isSameCustomerAddress(
        {
          province: savedAddress.provincia,
          city: savedAddress.ciudad,
          address: savedAddress.direccion,
          deliveryReference: savedAddress.referencia,
          contactPhone: savedAddress.celular_contacto,
        },
        {
          province,
          city,
          address,
          deliveryReference,
          contactPhone,
        },
      ),
  );

  if (matchingAddress) {
    if (wantsPrimary && !matchingAddress.principal) {
      const { error: clearPrimaryError } = await supabase
        .from("direcciones_cliente")
        .update({ principal: false })
        .eq("cliente_id", user.id)
        .eq("activa", true);

      if (clearPrimaryError) {
        reportServerError("Customer primary address clear failed", clearPrimaryError);
        return { message: "No pudimos actualizar la dirección principal.", success: false };
      }

      await supabase
        .from("direcciones_cliente")
        .update({ principal: true })
        .eq("id", matchingAddress.id)
        .eq("cliente_id", user.id);
    }

    revalidatePath("/mi-cuenta");
    revalidatePath("/checkout");
    return { message: "Esa dirección ya estaba guardada.", success: true };
  }

  const shouldBePrimary = wantsPrimary || isCurrentPrimary || !activeAddresses?.length;

  if (shouldBePrimary) {
    const { error: clearPrimaryError } = await supabase
      .from("direcciones_cliente")
      .update({ principal: false })
      .eq("cliente_id", user.id)
      .eq("activa", true);

    if (clearPrimaryError) {
      reportServerError("Customer primary address reset failed", clearPrimaryError);
      return {
        message: "No pudimos actualizar la dirección principal.",
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
    reportServerError("Customer address save failed", error);
    return {
      message: "No pudimos guardar la dirección. Intenta nuevamente.",
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
    reportServerError("Customer primary address change failed", clearPrimaryError);
    return {
      message: "No pudimos actualizar la dirección principal.",
      success: false,
    };
  }

  const { error } = await supabase
    .from("direcciones_cliente")
    .update({ principal: true })
    .eq("id", addressId)
    .eq("cliente_id", user.id);

  if (error) {
    reportServerError("Customer primary address update failed", error);
    return {
      message: "No pudimos actualizar la dirección principal.",
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
    reportServerError("Customer address deactivation failed", error);
    return {
      message: "No pudimos eliminar la dirección.",
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
