import Link from "next/link";
import { ShieldX } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { accountHome } from "@/lib/permissions";

export default async function AccessDeniedPage() {
  const user = await currentUser();
  return (
    <main className="container py-16 text-center">
      <ShieldX className="mx-auto text-[#69736e]" size={42} aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-bold">هذا الإجراء غير متاح لحسابك</h1>
      <p className="my-4 text-[#69736e]">حسابك لا يملك صلاحية الوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء.</p>
      <Link className="btn btn-primary" href={user ? accountHome(user) : "/login"}>العودة إلى حسابي</Link>
    </main>
  );
}
