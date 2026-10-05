"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActionButton({ url, label, icon, className = "btn btn-secondary" }: { url: string; label: string; icon?: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function click() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(url, { method: "PATCH" });
      if (!response.ok) { const body = await response.json(); setError(body.message ?? "تعذر تنفيذ العملية"); return; }
      router.refresh();
    } catch { setError("تعذر الاتصال، حاول مجدداً"); }
    finally { setLoading(false); }
  }
  return <div><button onClick={click} disabled={loading} className={className}>{icon}{loading ? "..." : label}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
