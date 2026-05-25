import type { User } from "@supabase/supabase-js";
import type { PublicUserSummary } from "@/types/user";

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getPublicUserSummary(user: User): PublicUserSummary {
  const firstName = getStringMetadata(user, "first_name");
  const lastName = getStringMetadata(user, "last_name");
  const metadataFullName = [firstName, lastName].filter(Boolean).join(" ");
  const fullName =
    getStringMetadata(user, "full_name") ??
    (metadataFullName || undefined) ??
    user.email;

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    fullName,
    cedula: getStringMetadata(user, "cedula"),
    phone: getStringMetadata(user, "phone"),
  };
}
