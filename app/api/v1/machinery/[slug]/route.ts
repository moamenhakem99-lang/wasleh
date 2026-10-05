import { ok, error } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { decodeMachinerySlug } from "@/lib/machinery-slug";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: encodedSlug } = await params;
  const slug = decodeMachinerySlug(encodedSlug);
  if (!slug) return error(404, "NOT_FOUND", "لم يتم العثور على الآلية");
  const item = await prisma.machinery.findUnique({
    where: { slug },
    include: { category: true, location: true, images: { orderBy: { sortOrder: "asc" } }, owner: { select: { id: true, name: true, phone: true, ownerProfile: true } }, reviews: { where: { hidden: false }, include: { farmer: { select: { name: true } } } } }
  });
  if (!item || !item.active || item.approvalStatus !== "APPROVED") return error(404, "NOT_FOUND", "لم يتم العثور على الآلية");
  return ok({ item });
}
