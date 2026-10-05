import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasPermission, type Permission } from "@/lib/permissions";

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-access-secret");
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret");

export type AuthUser = { id: string; role: Role; phone: string; name: string };

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export async function signAccessToken(user: AuthUser) {
  return new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN ?? "15m").sign(accessSecret);
}

export async function signRefreshToken(user: AuthUser) {
  return new SignJWT({ id: user.id, role: user.role }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN ?? "30d").sign(refreshSecret);
}

export const currentUser = cache(async (): Promise<AuthUser | null> => {
  const token = (await cookies()).get("wasla_access")?.value;
  if (!token) return null;
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, accessSecret, { algorithms: ["HS256"] });
    if (typeof payload.id !== "string" || !payload.id) return null;
    userId = payload.id;
  } catch {
    return null;
  }
  // The database, not an older token, decides the current role and account status.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, phone: true, name: true, active: true }
  });
  if (!user?.active) return null;
  return { id: user.id, role: user.role, phone: user.phone, name: user.name };
});

export async function requirePermission(permission: Permission) {
  const user = await currentUser();
  if (!user) return { user: null, response: Response.json({ statusCode: 401, code: "UNAUTHENTICATED", message: "يرجى تسجيل الدخول" }, { status: 401 }) };
  if (!hasPermission(user, permission)) {
    return { user: null, response: Response.json({ statusCode: 403, code: "FORBIDDEN", message: "لا تملك صلاحية تنفيذ هذه العملية" }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function requirePagePermission(permission: Permission, returnTo: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!hasPermission(user, permission)) redirect("/access-denied");
  return user;
}

export async function setAuthCookies(user: AuthUser) {
  const cookieStore = await cookies();
  cookieStore.set("wasla_access", await signAccessToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 15 });
  cookieStore.set("wasla_refresh", await signRefreshToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("wasla_access");
  cookieStore.delete("wasla_refresh");
}

export async function authShape(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return { id: user.id, role: user.role, phone: user.phone, name: user.name };
}
