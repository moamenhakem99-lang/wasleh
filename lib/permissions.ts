import type { Role } from "@prisma/client";

export type Permission =
  | "machinery:create"
  | "machinery:moderate"
  | "owner:access"
  | "admin:access"
  | "owners:create"
  | "bookings:read"
  | "bookings:read:any"
  | "bookings:create"
  | "bookings:manage"
  | "bookings:manage:any"
  | "bookings:review";

type Principal = { id: string; role: Role };
const administrators: readonly Role[] = ["ADMIN", "SUPER_ADMIN"];
const owners: readonly Role[] = ["MACHINERY_OWNER", ...administrators];
const permissions: Record<Permission, readonly Role[]> = {
  "machinery:create": owners,
  "machinery:moderate": administrators,
  "owner:access": owners,
  "admin:access": administrators,
  "owners:create": administrators,
  "bookings:read": ["FARMER", ...owners],
  "bookings:read:any": administrators,
  "bookings:create": ["FARMER", ...administrators],
  "bookings:manage": owners,
  "bookings:manage:any": administrators,
  "bookings:review": ["FARMER"]
};

export function hasPermission(user: Principal | null | undefined, permission: Permission) {
  return !!user && permissions[permission].includes(user.role);
}

export function accountHome(user: Principal) {
  if (hasPermission(user, "admin:access")) return "/admin";
  if (hasPermission(user, "owner:access")) return "/owner";
  return "/machinery";
}

export function allowedReturnTo(user: Principal, requested?: string) {
  if (!requested?.startsWith("/") || requested.startsWith("//") || requested.includes("\\")) return accountHome(user);
  const url = new URL(requested, "http://wasla.local");
  if (url.origin !== "http://wasla.local") return accountHome(user);
  const path = url.pathname;
  const destination = path + url.search + url.hash;
  const required: Record<string, Permission> = {
    "/add-machinery": "machinery:create",
    "/book": "bookings:create",
    "/owner": "owner:access",
    "/admin": "admin:access"
  };
  if (required[path] && hasPermission(user, required[path])) return destination;
  if (path === "/" || path === "/machinery") return destination;
  return accountHome(user);
}
