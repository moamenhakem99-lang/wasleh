import { ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requirePermission("admin:access");
  if (auth.response) return auth.response;
  const items = await prisma.machinery.findMany({ where: { approvalStatus: "PENDING" }, include: { owner: { select: { id: true, name: true, phone: true } }, category: true, location: true, images: true } });
  return ok({ items });
}
