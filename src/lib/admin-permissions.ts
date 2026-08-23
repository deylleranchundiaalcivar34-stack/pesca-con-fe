const ADMIN_ROLES = ["dueno", "admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminPermission =
  | "admin.access"
  | "dashboard.read"
  | "catalog.read"
  | "catalog.write"
  | "orders.read"
  | "orders.write"
  | "customers.read"
  | "inventory.export"
  | "roles.manage";

const ROLE_PERMISSIONS: Record<Exclude<AdminRole, "dueno">, ReadonlySet<AdminPermission>> = {
  admin: new Set([
    "admin.access",
    "dashboard.read",
    "catalog.read",
    "catalog.write",
    "orders.read",
    "orders.write",
    "customers.read",
    "inventory.export",
  ]),
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  return role === "dueno" || ROLE_PERMISSIONS[role].has(permission);
}
