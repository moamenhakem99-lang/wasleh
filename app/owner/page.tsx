import Link from "next/link";
import { requirePagePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionButton } from "@/components/action-button";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const user = await requirePagePermission("owner:access", "/owner");
  const [machinery, bookings] = await Promise.all([
    prisma.machinery.findMany({ where: { ownerId: user.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.booking.findMany({ where: { machinery: { ownerId: user.id } }, include: { machinery: true, farmer: { select: { name: true } } }, orderBy: { createdAt: "desc" } })
  ]);
  return (
    <main className="container py-8">
      <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-extrabold">لوحة مالك الآليات</h1><Link className="btn btn-primary" href="/add-machinery">أضف آلية</Link></div>
      <section className="grid gap-4 md:grid-cols-3"><div className="card p-5"><b>آلياتي</b><p className="text-3xl font-extrabold">{machinery.length}</p></div><div className="card p-5"><b>طلبات الحجز</b><p className="text-3xl font-extrabold">{bookings.length}</p></div><div className="card p-5"><b>بانتظار الرد</b><p className="text-3xl font-extrabold">{bookings.filter(b=>b.status==="PENDING").length}</p></div></section>
      <h2 className="mb-3 mt-8 text-xl font-extrabold">طلبات الحجز</h2>
      <div className="grid gap-3">{bookings.map(b => <div className="card flex flex-wrap items-center justify-between gap-3 p-4" key={b.id}><div><b>{b.machinery.title}</b><p className="text-sm text-[#647067]">{b.farmer.name} · {b.status}</p></div>{b.status==="PENDING" && <div className="flex gap-2"><ActionButton url={`/api/v1/owner/bookings/${b.id}/accept`} label="قبول" className="btn btn-primary"/><ActionButton url={`/api/v1/owner/bookings/${b.id}/reject`} label="رفض"/></div>}</div>)}</div>
      <h2 className="mb-3 mt-8 text-xl font-extrabold">آلياتي</h2>
      <div className="grid gap-3">{machinery.map(m => <div className="card p-4" key={m.id}><b>{m.title}</b><p className="text-sm text-[#647067]">{m.category.nameAr} · {m.approvalStatus}</p></div>)}</div>
    </main>
  );
}
