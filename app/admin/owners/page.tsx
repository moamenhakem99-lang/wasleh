import Link from "next/link";
import { Prisma } from "@prisma/client";
import { UserPlus, Search, UsersRound, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth";
import { shortDate } from "@/lib/admin-format";

export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requirePagePermission("admin:access", "/admin/owners");
  const { q = "", status = "", page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(rawPage ?? "1") || 1));
  const where: Prisma.UserWhereInput = { role: "MACHINERY_OWNER" };
  if (q.trim()) where.OR = [{ name: { contains: q.trim(), mode: "insensitive" } }, { phone: { contains: q.trim() } }, { ownerProfile: { businessName: { contains: q.trim(), mode: "insensitive" } } }];
  if (status === "verified") where.ownerProfile = { verificationStatus: "VERIFIED" };
  if (status === "pending") where.ownerProfile = { verificationStatus: { in: ["PENDING", "UNVERIFIED"] } };
  const [owners, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (page - 1) * 12, take: 12, orderBy: { createdAt: "desc" }, select: { id: true, name: true, phone: true, active: true, createdAt: true, ownerProfile: true, _count: { select: { machinery: true } } } }),
    prisma.user.count({ where })
  ]);
  const pageHref = (value: number) => "/admin/owners?" + new URLSearchParams({ q, status, page: String(value) });
  return <>
    <div className="admin-page-heading"><div><p className="admin-kicker">إدارة الحسابات</p><h1>ملاك الآليات</h1><p>{total} مالك آلية</p></div><Link className="btn btn-primary" href="/admin/owners/new"><UserPlus/>إضافة مالك آلية</Link></div>
    <form className="admin-filters"><label className="admin-search"><Search size={18}/><input name="q" defaultValue={q} placeholder="اسم المالك، النشاط أو رقم الهاتف" aria-label="بحث عن مالك"/></label><select className="input" name="status" defaultValue={status} aria-label="حالة التوثيق"><option value="">كل الحالات</option><option value="verified">موثق</option><option value="pending">بانتظار التوثيق</option></select><button className="btn btn-secondary"><Search size={17}/>بحث</button></form>
    {owners.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>المالك</th><th>رقم الهاتف</th><th>الآليات</th><th>التوثيق</th><th>الحساب</th><th>تاريخ الانضمام</th></tr></thead><tbody>{owners.map(owner => <tr key={owner.id}><td><div className="owner-cell"><span className="owner-avatar">{owner.name.slice(0, 1)}</span><div><b>{owner.name}</b><small>{owner.ownerProfile?.businessName ?? "—"}</small></div></div></td><td><a dir="ltr" href={`tel:${owner.phone}`}>{owner.phone}</a></td><td>{owner._count.machinery}</td><td><span className={`badge ${owner.ownerProfile?.verificationStatus === "VERIFIED" ? "badge-green" : "badge-gold"}`}>{owner.ownerProfile?.verificationStatus === "VERIFIED" ? <><ShieldCheck size={13}/>موثق</> : "بانتظار التوثيق"}</span></td><td><span className={`badge ${owner.active ? "badge-green" : "badge-red"}`}>{owner.active ? "نشط" : "معطل"}</span></td><td>{shortDate(owner.createdAt)}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><UsersRound size={30}/><p>لا يوجد ملاك مطابقون للبحث.</p></div>}
    <div className="admin-pagination"><span>صفحة {page} من {Math.max(1, Math.ceil(total / 12))}</span><div>{page > 1 && <Link className="btn btn-secondary" href={pageHref(page - 1)}>السابق</Link>}{page * 12 < total && <Link className="btn btn-secondary" href={pageHref(page + 1)}>التالي</Link>}</div></div>
  </>;
}
