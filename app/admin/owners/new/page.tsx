import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requirePagePermission } from "@/lib/auth";
import { OwnerForm } from "@/components/owner-form";

export default async function NewOwnerPage() {
  await requirePagePermission("owners:create", "/admin/owners/new");
  return <><Link className="text-link" href="/admin/owners"><ArrowRight size={17}/>ملاك الآليات</Link><div className="admin-page-heading"><div><h1>إضافة مالك آلية</h1><p>حساب جديد على منصة وصلة</p></div></div><OwnerForm/></>;
}
