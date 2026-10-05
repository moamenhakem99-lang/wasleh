import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { CalendarDays, Filter } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth";
import { bookingLabels, shortDate } from "@/lib/admin-format";

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requirePagePermission("admin:access", "/admin/bookings");
  const { status = "", page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(rawPage ?? "1") || 1));
  const where = Object.values(BookingStatus).includes(status as BookingStatus) ? { status: status as BookingStatus } : {};
  const [items, total] = await Promise.all([prisma.booking.findMany({ where, skip: (page - 1) * 12, take: 12, orderBy: { createdAt: "desc" }, include: { machinery: { select: { title: true, owner: { select: { name: true } } } }, farmer: { select: { name: true } } } }), prisma.booking.count({ where })]);
  const href = (value: number) => "/admin/bookings?" + new URLSearchParams({ status, page: String(value) });
  return <><div className="admin-page-heading"><div><p className="admin-kicker">نشاط المنصة</p><h1>الحجوزات</h1><p>{total} طلب حجز</p></div></div><form className="admin-filters"><select className="input" name="status" aria-label="حالة الحجز" defaultValue={status}><option value="">كل الحالات</option>{Object.entries(bookingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="btn btn-secondary"><Filter size={17}/>تصفية</button></form>{items.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>الآلية</th><th>المستأجر</th><th>المالك</th><th>الفترة</th><th>الحالة</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><b>{item.machinery.title}</b></td><td>{item.farmer.name}</td><td>{item.machinery.owner.name}</td><td>{shortDate(item.startDate)}<small>إلى {shortDate(item.endDate)}</small></td><td><span className={`badge ${item.status === "COMPLETED" || item.status === "ACCEPTED" ? "badge-green" : item.status === "PENDING" ? "badge-gold" : "badge-red"}`}>{bookingLabels[item.status]}</span></td></tr>)}</tbody></table></div> : <div className="admin-empty"><CalendarDays size={28}/><p>لا توجد حجوزات مطابقة.</p></div>}<div className="admin-pagination"><span>صفحة {page} من {Math.max(1, Math.ceil(total / 12))}</span><div>{page > 1 && <Link className="btn btn-secondary" href={href(page - 1)}>السابق</Link>}{page * 12 < total && <Link className="btn btn-secondary" href={href(page + 1)}>التالي</Link>}</div></div></>;
}
