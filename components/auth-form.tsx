"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { allowedReturnTo } from "@/lib/permissions";

export function AuthForm({ mode, returnTo }: { mode: "login" | "register"; returnTo?: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(formData: FormData) {
    setLoading(true); setError("");
    try {
    const body = Object.fromEntries(formData.entries());
    const res = await fetch(`/api/v1/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setError(json.message ?? "حدث خطأ");
    router.replace(allowedReturnTo(json.user, returnTo));
    router.refresh();
    } catch { setError("تعذر الاتصال، حاول مجدداً"); }
    finally { setLoading(false); }
  }
  return (
    <form action={submit} className="card mx-auto mt-10 max-w-md space-y-4 p-6">
      <Image src="/logo.png" alt="وصلة" width={72} height={72} className="mx-auto" />
      <h1 className="text-2xl font-extrabold">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
      {mode === "register" && <input className="input" name="name" placeholder="الاسم الكامل" required />}
      <input className="input" name="phone" placeholder="رقم الهاتف" required />
      <input className="input" name="password" type="password" placeholder="كلمة المرور" required />
      {mode === "register" && <select className="input" name="role" defaultValue="FARMER"><option value="FARMER">مزارع / مستأجر</option><option value="MACHINERY_OWNER">مالك آلية</option></select>}
      {error && <p className="text-sm text-[#C53B32]">{error}</p>}
      <button disabled={loading} className="btn btn-primary w-full">{loading ? "جار المعالجة..." : mode === "login" ? "دخول" : "تسجيل"}</button>
    </form>
  );
}
