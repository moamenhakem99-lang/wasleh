import { Prisma } from "@prisma/client";
import { ok, error, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("bookings:review");
  if (auth.response) return auth.response;
  const { data, response } = await readJson(request, reviewSchema);
  if (response) return response;
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.farmerId !== auth.user.id) return error(404, "NOT_FOUND", "لم يتم العثور على الحجز");
  if (booking.status !== "COMPLETED") return error(409, "REVIEW_NOT_ALLOWED", "يمكن التقييم بعد اكتمال الحجز فقط");
  try {
    const review = await prisma.$transaction(async (tx) => {
      const item = await tx.review.create({ data: { ...data, bookingId: id, farmerId: auth.user.id, machineryId: booking.machineryId } });
      const stats = await tx.review.aggregate({ where: { machineryId: booking.machineryId, hidden: false }, _avg: { rating: true }, _count: true });
      await tx.machinery.update({ where: { id: booking.machineryId }, data: { averageRating: stats._avg.rating ?? 0, reviewCount: stats._count } });
      return item;
    });
    return ok({ item: review }, 201);
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") return error(409, "ALREADY_REVIEWED", "سبق تقييم هذا الحجز");
    throw cause;
  }
}
