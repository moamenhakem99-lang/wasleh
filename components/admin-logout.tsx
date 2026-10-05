"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export function AdminLogout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/login"); router.refresh();
    } catch { setError("تعذر تسجيل الخروج"); }
    finally { setBusy(false); }
  }
  return <div className="flex items-center gap-3">{error && <span role="alert">{error}</span>}<button type="button" className="icon-button" aria-label="تسجيل الخروج" title="تسجيل الخروج" disabled={busy} onClick={logout}><LogOut size={18}/></button></div>;
}
