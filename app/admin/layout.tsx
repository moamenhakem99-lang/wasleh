import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requirePagePermission } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogout } from "@/components/admin-logout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePagePermission("admin:access", "/admin");
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand"><Image src="/logo.png" width={50} height={50} alt="وصلة"/><span><strong>وصلة</strong><small>مساحة الإدارة</small></span></Link>
      <AdminNav/>
      <div className="admin-account"><ShieldCheck size={23}/><div><b>{user.name}</b><span>{user.role === "SUPER_ADMIN" ? "مدير النظام" : "مدير المنصة"}</span></div></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><span>لوحة الإدارة</span><div className="flex items-center gap-4"><span className="badge badge-green"><ShieldCheck size={14}/>وصول إداري</span><AdminLogout/></div></header><main id="main-content" className="admin-content">{children}</main></div>
  </div>;
}
