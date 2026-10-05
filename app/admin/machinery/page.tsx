import Link from "next/link";
import { ApprovalStatus, Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth";
import { approvalLabels } from "@/lib/admin-format";
import { AdminMachineryTable } from "@/components/admin-machinery-table";

export default async function AdminMachineryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requirePagePermission("admin:access", "/admin/machinery");
  const { q = "", status = "", page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(rawPage ?? "1") || 1));
  const where: Prisma.MachineryWhereInput = {};
  if (q.trim()) where.OR = [{ title: { contains: q.trim(), mode: "insensitive" } }, { owner: { name: { contains: q.trim(), mode: "insensitive" } } }];
  if (Object.values(ApprovalStatus).includes(status as ApprovalStatus)) where.approvalStatus = status as ApprovalStatus;
  const [items, total] = await Promise.all([prisma.machinery.findMany({ where, skip: (page - 1) * 12, take: 12, orderBy: { createdAt: "desc" }, include: { owner: { select: { name: true } }, category: true, location: true, images: { orderBy: { sortOrder: "asc" } } } }), prisma.machinery.count({ where })]);
  const href = (value: number) => "/admin/machinery?" + new URLSearchParams({ q, status, page: String(value) });
  return <><div className="admin-page-heading"><div><p className="admin-kicker">إدارة العروض</p><h1>الآليات والمراجعات</h1><p>{total} آلية</p></div></div>
    <form className="admin-filters"><label className="admin-search"><Search size={18}/><input name="q" defaultValue={q} placeholder="اسم الآلية أو المالك" aria-label="بحث عن آلية"/></label><select className="input" name="status" defaultValue={status} aria-label="حالة الآلية"><option value="">كل الحالات</option>{Object.entries(approvalLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="btn btn-secondary"><Search size={17}/>بحث</button></form>
    <AdminMachineryTable items={items}/><div className="admin-pagination"><span>صفحة {page} من {Math.max(1, Math.ceil(total / 12))}</span><div>{page > 1 && <Link className="btn btn-secondary" href={href(page - 1)}>السابق</Link>}{page * 12 < total && <Link className="btn btn-secondary" href={href(page + 1)}>التالي</Link>}</div></div>
  </>;
}
