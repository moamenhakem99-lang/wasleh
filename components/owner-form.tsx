"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react";

export function OwnerForm() {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; phone: string } | null>(null);
  const router = useRouter();
  async function submit(form: FormData) {
    setSaving(true); setError("");
    try {
      const body = { name: form.get("name"), phone: form.get("phone"), businessName: form.get("businessName"), password: form.get("password"), verified: form.get("verified") === "on" };
      const response = await fetch("/api/v1/admin/owners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok) { setError(json.message ?? "تعذر إنشاء الحساب"); return; }
      setCreated(json.owner); router.refresh();
    } catch { setError("تعذر الاتصال، حاول مجدداً"); }
    finally { setSaving(false); }
  }
  if (created) return <div className="owner-success" role="status"><CheckCircle2 size={40}/><h2>تم إنشاء حساب المالك</h2><p>{created.name}</p><p dir="ltr">{created.phone}</p><div><Link href="/admin/owners" className="btn btn-primary">عرض الملاك</Link><button type="button" className="btn btn-secondary" onClick={() => setCreated(null)}><UserPlus/>إضافة مالك آخر</button></div></div>;
  return <form action={submit} className="entry-form owner-entry">
    <fieldset disabled={saving}>
      <section className="form-section"><h2>بيانات المالك</h2><div className="form-grid">
        <label>الاسم الكامل<input className="input" name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="اسم المالك"/></label>
        <label>اسم النشاط<input className="input" name="businessName" minLength={2} maxLength={120} required placeholder="اسم مؤسسة أو نشاط التأجير"/></label>
        <label>رقم الهاتف<input className="input" name="phone" type="tel" dir="ltr" autoComplete="tel" minLength={7} maxLength={22} required placeholder="+963 9XX XXX XXX"/></label>
      </div></section>
      <section className="form-section"><h2>الوصول والتوثيق</h2><div className="form-grid">
        <label className="password-field">كلمة المرور<div><input className="input" name="password" type={visible ? "text" : "password"} autoComplete="new-password" minLength={10} maxLength={72} required placeholder="10 محارف على الأقل"/><button className="icon-button" type="button" aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} title={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        <label>نوع الحساب<input className="input" value="مالك آلية" readOnly/></label>
        <label className="check-field form-wide"><input type="checkbox" name="verified"/>تم التحقق من هوية المالك</label>
      </div></section>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-submit"><button className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin"/> : <UserPlus/>}{saving ? "جار الإنشاء..." : "إنشاء حساب المالك"}</button><Link href="/admin/owners" className="btn btn-secondary">إلغاء</Link></div>
  </form>;
}
