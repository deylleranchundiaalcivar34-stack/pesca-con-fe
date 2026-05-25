"use server";

import { revalidatePath } from "next/cache";
import { isValidEcuadorianCedula } from "@/lib/ecuador";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  message?: string;
  success?: boolean;
};

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const cedula = String(formData.get("cedula") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName || !phone) {
    return {
      message: "Completa nombre, apellido y celular.",
      success: false,
    };
  }

  if (!isValidEcuadorianCedula(cedula)) {
    return {
      message: "Ingresa una cédula ecuatoriana válida.",
      success: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      phone,
      cedula,
    },
  });

  if (error) {
    return {
      message: error.message,
      success: false,
    };
  }

  const { error: profileError } = await supabase.from("perfiles_cliente").upsert({
    id: user.id,
    nombres: firstName,
    apellidos: lastName,
    cedula,
    celular: phone,
    correo: user.email ?? "",
  });

  if (profileError) {
    return {
      message: profileError.message,
      success: false,
    };
  }

  revalidatePath("/");
  revalidatePath("/mi-perfil");
  revalidatePath("/mi-cuenta");

  return {
    message: "Perfil actualizado.",
    success: true,
  };
}
