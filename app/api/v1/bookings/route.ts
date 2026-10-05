import { BookingStatus } from "@prisma/client";
import { ok, readJson, error } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/schemas";
import { bookingReadScope } from "@/lib/booking-access";

export async function GET() {
  const auth = await requirePermission("bookings:read");
  if (auth.response) return auth.response;
  const where = bookingReadScope(auth.user);
  const items = await prisma.booking.findMany({ where, include: { machinery: { include: { images: true, category: true } }, farmer: { select: { name: true, phone: true } } }, orderBy: { createdAt: "desc" } });
  return ok({ items });
}

export async function POST(request: Request) {
  const auth = await requirePermission("bookings:create");
  if (auth.response) return auth.response;
  const { data, response } = await readJson(request, bookingSchema);
  if (response) return response;
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (endDate <= startDate) return error(400, "INVALID_DATES", "تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
  const machine = await prisma.machinery.findFirst({ where: { id: data.machineryId, active: true, approvalStatus: "APPROVED", availabilityStatus: "AVAILABLE", owner: { active: true } } });
  if (!machine) return error(404, "NOT_FOUND", "الآلية غير متاحة للحجز");
  if (machine.ownerId === auth.user.id) return error(403, "FORBIDDEN", "لا يمكنك حجز آليتك");
  const conflict = await prisma.booking.findFirst({
    where: { machineryId: data.machineryId, status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] }, startDate: { lt: endDate }, endDate: { gt: startDate } }
  });
  if (conflict) return error(409, "BOOKING_CONFLICT", "هذه الفترة غير متاحة لهذه الآلية");
  const booking = await prisma.booking.create({ data: { ...data, startDate, endDate, farmerId: auth.user.id, quotedPrice: machine.price } });
  await prisma.notification.create({ data: { userId: machine.ownerId, title: "طلب حجز جديد", body: `وصل طلب حجز على ${machine.title}` } });
  return ok({ item: booking }, 201);
}
