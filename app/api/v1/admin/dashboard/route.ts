import { ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requirePermission("admin:access");
  if (auth.response) return auth.response;
  const [users, machinery, pendingMachinery, bookings, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.machinery.count(),
    prisma.machinery.count({ where: { approvalStatus: "PENDING" } }),
    prisma.booking.count(),
    prisma.review.count({ where: { hidden: false } })
  ]);
  return ok({ users, machinery, pendingMachinery, bookings, reviews });
}
