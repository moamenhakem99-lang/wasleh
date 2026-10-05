import { ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.location.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }] });
  return ok({ items });
}
