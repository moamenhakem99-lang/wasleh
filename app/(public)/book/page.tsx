import { BookingForm } from "@/components/booking-form";
import { requirePagePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ machineryId?: string }> }) {
  const { machineryId } = await searchParams;
  const user = await requirePagePermission("bookings:create", machineryId ? `/book?machineryId=${encodeURIComponent(machineryId)}` : "/book");
  if (machineryId) {
    const item = await prisma.machinery.findFirst({ where: { id: machineryId, active: true, approvalStatus: "APPROVED", availabilityStatus: "AVAILABLE", owner: { active: true }, NOT: { ownerId: user.id } } });
    if (!item) notFound();
  }
  return <main className="container py-8">{machineryId ? <BookingForm machineryId={machineryId} /> : <div className="card p-8">اختر آلية أولا.</div>}</main>;
}
