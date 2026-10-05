import { requirePermission } from "@/lib/auth";
import { transitionBooking } from "@/lib/booking-access";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("bookings:manage");
  if (auth.response) return auth.response;
  const { id } = await params;
  return transitionBooking(auth.user, id, "ACCEPTED", "COMPLETED");
}
