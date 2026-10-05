import Link from "next/link";
import { ArrowLeft, UsersRound, Tractor, ClipboardCheck, CalendarDays, UserPlus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth";
import { AdminMachineryTable } from "@/components/admin-machinery-table";
import { shortDate, bookingLabels } from "@/lib/admin-format";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requirePagePermission("admin:access", "/admin");
  const [owners, machineryCount, pendingCount, bookingCount, pending, latestOwners, bookings] = await Promise.all([
    prisma.user.count({ where: { role: "MACHINERY_OWNER" } }),
    prisma.machinery.count(),
    prisma.machinery.count({ where: { approvalStatus: "PENDING" } }),
    prisma.booking.count(),
    prisma.machinery.findMany({ where: { approvalStatus: "PENDING" }, take: 5, orderBy: { createdAt: "desc" }, include: { owner: { select: { name: true } }, category: true, location: true, images: { orderBy: { sortOrder: "asc" } } } }),
    prisma.user.findMany({ where: { role: "MACHINERY_OWNER" }, take: 4, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true, ownerProfile: { select: { businessName: true, verificationStatus: true } } } }),
    prisma.booking.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { farmer: { select: { name: true } }, machinery: { select: { title: true } } } })
  ]);
  const stats = [
    { label: "ملاك الآليات", value: owners, icon: UsersRound, href: "/admin/owners", color: "green" },
    { label: "إجمالي الآليات", value: machineryCount, icon: Tractor, href: "/admin/machinery", color: "blue" },
    { label: "بانتظار المراجعة", value: pendingCount, icon: ClipboardCheck, href: "/admin/machinery?status=PENDING", color: "gold" },
    { label: "طلبات الحجز", value: bookingCount, icon: CalendarDays, href: "/admin/bookings", color: "rose" }
  ];
  return <>
    <div className="admin-page-heading"><div><p className="admin-kicker">أهلاً، {user.name}</p><h1>نظرة عامة</h1><p>آخر نشاط على منصة وصلة</p></div><Link href="/admin/owners/new" className="btn btn-primary"><UserPlus/>إضافة مالك آلية</Link></div>
    <div className="admin-stats">{stats.map(({ label, value, icon: Icon, href, color }) => <Link href={href} className="admin-stat" key={label}><span className={`stat-icon ${color}`}><Icon size={22}/></span><span>{label}<strong>{new Intl.NumberFormat("ar-SY").format(value)}</strong></span><ArrowLeft size={17}/></Link>)}</div>
    <section className="admin-section"><div className="admin-section-heading"><div><h2>قائمة المراجعة <span className="badge badge-gold">{pendingCount}</span></h2></div><Link href="/admin/machinery?status=PENDING" className="text-link">عرض الكل<ArrowLeft size={16}/></Link></div><AdminMachineryTable items={pending}/></section>
    <div className="admin-columns">
      <section className="admin-section"><div className="admin-section-heading"><h2>أحدث الحجوزات</h2><Link href="/admin/bookings" className="text-link">عرض الكل<ArrowLeft size={16}/></Link></div>{bookings.length ? <div className="admin-activity">{bookings.map(booking => <div key={booking.id}><span className="activity-icon"><CalendarDays size={19}/></span><div><b>{booking.machinery.title}</b><small>{booking.farmer.name} · {shortDate(booking.startDate)}</small></div><span className={`badge ${booking.status === "COMPLETED" ? "badge-green" : "badge-gold"}`}>{bookingLabels[booking.status]}</span></div>)}</div> : <p className="admin-empty">لا توجد حجوزات بعد.</p>}</section>
      <section className="admin-section"><div className="admin-section-heading"><h2>الملاك الجدد</h2><Link href="/admin/owners" className="text-link">عرض الكل<ArrowLeft size={16}/></Link></div><div className="admin-activity">{latestOwners.map(owner => <div key={owner.id}><span className="owner-avatar">{owner.name.slice(0, 1)}</span><div><b>{owner.name}</b><small>{owner.ownerProfile?.businessName ?? shortDate(owner.createdAt)}</small></div>{owner.ownerProfile?.verificationStatus === "VERIFIED" && <ShieldCheck className="text-green-700" size={18} aria-label="موثق"/>}</div>)}</div></section>
    </div>
  </>;
}
