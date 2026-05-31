import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerAddress, CustomerProfile } from "@/types/customer";
import type { PublicUserSummary } from "@/types/user";

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type DbCustomerProfile = {
  id: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string | null;
  cedula: string;
  celular: string;
  correo: string;
};

type DbCustomerAddress = {
  id: string;
  cliente_id: string;
  alias: string;
  provincia: string;
  ciudad: string;
  direccion: string;
  referencia: string | null;
  celular_contacto: string | null;
  principal: boolean;
  activa: boolean;
};

function mapCustomerProfile(row: DbCustomerProfile): CustomerProfile {
  const fullName = row.nombre_completo ?? `${row.nombres} ${row.apellidos}`.trim();

  return {
    id: row.id,
    firstName: row.nombres,
    lastName: row.apellidos,
    fullName,
    cedula: row.cedula,
    phone: row.celular,
    email: row.correo,
  };
}

function mapCustomerAddress(row: DbCustomerAddress): CustomerAddress {
  return {
    id: row.id,
    customerId: row.cliente_id,
    alias: row.alias,
    province: row.provincia,
    city: row.ciudad,
    address: row.direccion,
    deliveryReference: row.referencia ?? undefined,
    contactPhone: row.celular_contacto ?? undefined,
    isPrimary: row.principal,
    isActive: row.activa,
  };
}

export async function getCustomerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from("perfiles_cliente")
    .select("id, nombres, apellidos, nombre_completo, cedula, celular, correo")
    .eq("id", userId)
    .maybeSingle<DbCustomerProfile>();

  if (error || !data) {
    return null;
  }

  return mapCustomerProfile(data);
}

export async function getCustomerAddresses(
  supabase: SupabaseClient,
  userId: string,
): Promise<CustomerAddress[]> {
  const { data, error } = await supabase
    .from("direcciones_cliente")
    .select("id, cliente_id, alias, provincia, ciudad, direccion, referencia, celular_contacto, principal, activa")
    .eq("cliente_id", userId)
    .eq("activa", true)
    .order("principal", { ascending: false })
    .order("alias", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as DbCustomerAddress[]).map(mapCustomerAddress);
}

export function getPublicUserSummary(
  user: User,
  profile?: CustomerProfile | null,
): PublicUserSummary {
  const firstName = profile?.firstName || getStringMetadata(user, "first_name");
  const lastName = profile?.lastName || getStringMetadata(user, "last_name");
  const metadataFullName = [firstName, lastName].filter(Boolean).join(" ");
  const fullName =
    (profile?.fullName ||
      getStringMetadata(user, "full_name") ||
      metadataFullName ||
      user.email);

  return {
    id: user.id,
    email: profile?.email || user.email,
    firstName,
    lastName,
    fullName,
    cedula: profile?.cedula || getStringMetadata(user, "cedula"),
    phone: profile?.phone || getStringMetadata(user, "phone"),
  };
}
