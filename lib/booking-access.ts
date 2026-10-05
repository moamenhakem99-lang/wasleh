import type { BookingStatus, Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { error, ok } from "@/lib/api";

export function bookingReadScope(user: AuthUser): Prisma.BookingWhereInput {
  if (hasPermission(user, "bookings:read:any")) return {};
  if (user.role === "FARMER") return { farmerId: user.id };
  if (user.role === "MACHINERY_OWNER") return { machinery: { ownerId: user.id } };
  return { id: { in: [] } };
}

export function bookingManageScope(user: AuthUser): Prisma.BookingWhereInput {
  if (hasPermission(user, "bookings:manage:any")) return {};
  if (user.role === "MACHINERY_OWNER") return { machinery: { ownerId: user.id } };
  return { id: { in: [] } };
}

export async function transitionBooking(user: AuthUser, id: string, from: BookingStatus, to: BookingStatus) {
  const scope = bookingManageScope(user);
  const booking = await prisma.booking.findFirst({ where: { id, ...scope }, select: { id: true } });
  if (!booking) return error(404, "NOT_FOUND", "لم يتم العثور على الطلب");
  // Enforce ownership and the allowed state together, including concurrent requests.
  const result = await prisma.booking.updateMany({ where: { id, ...scope, status: from }, data: { status: to } });
  if (!result.count) return error(409, "INVALID_STATE", "حالة الطلب لا تسمح بهذا الإجراء");
  return ok({ item: await prisma.booking.findUnique({ where: { id } }) });
}
