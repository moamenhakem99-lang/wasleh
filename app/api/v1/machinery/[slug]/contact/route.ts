import { ok, error } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { decodeMachinerySlug } from "@/lib/machinery-slug";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: encodedSlug } = await params;
  const slug = decodeMachinerySlug(encodedSlug);
  if (!slug) return error(404, "NOT_FOUND", "لم يتم العثور على الآلية");
  const machine = await prisma.machinery.findFirst({ where: { slug, active: true, approvalStatus: "APPROVED", owner: { active: true } } });
  if (!machine) return error(404, "NOT_FOUND", "لم يتم العثور على الآلية");
  await prisma.interactionEvent.create({ data: { machineryId: machine.id, type: "CONTACT_CLICK" } });
  return ok({ tracked: true });
}
