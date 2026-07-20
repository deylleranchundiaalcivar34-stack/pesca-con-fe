const ADMIN_ROLES = ["dueno", "admin", "vendedor"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminPermission =
  | "admin.access"
  | "dashboard.read"
  | "catalog.read"
  | "catalog.write"
  | "orders.read"
  | "orders.write"
  | "customers.read"
  | "sales.read"
  | "sales.create"
  | "sales.override_price"
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
    "sales.read",
    "sales.create",
    "sales.override_price",
    "inventory.export",
  ]),
  vendedor: new Set(["admin.access", "catalog.read", "sales.read", "sales.create"]),
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  return role === "dueno" || ROLE_PERMISSIONS[role].has(permission);
}

export function getAdminHome(role: AdminRole) {
  return hasAdminPermission(role, "dashboard.read") ? "/admin" : "/admin/ventas-fisicas";
}
