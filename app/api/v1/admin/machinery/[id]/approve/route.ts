import { ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("admin:access");
  if (auth.response) return auth.response;
  const { id } = await params;
  return ok({ item: await prisma.machinery.update({ where: { id }, data: { approvalStatus: "APPROVED" } }) });
}
