"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LogIn, LogOut, Menu, Plus, X } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { hasPermission, accountHome } from "@/lib/permissions";

const links = [
  ["الرئيسية", "/"],
  ["تصفح الآليات", "/machinery"],
  ["كيف تعمل وصلة", "/how-it-works"],
  ["عن وصلة", "/about"]
];

export function Header({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch { setError("تعذر تسجيل الخروج، حاول مجدداً"); }
    finally { setLoggingOut(false); }
  }
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }}>
      <a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="وصلة - الرئيسية" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="" width={58} height={58} priority className="brand-image" />
          <span>
            <span className="brand-name">وصلة</span>
            <span className="brand-caption">أقرب لأرضك</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="header-actions">
          {user ? <><Link className="login-link" href={accountHome(user)}><span>{hasPermission(user, "owner:access") ? "لوحة التحكم" : "تصفح الآليات"}</span></Link><button type="button" className="btn btn-secondary" title="تسجيل الخروج" aria-label="تسجيل الخروج" disabled={loggingOut} onClick={logout}><LogOut size={18} /></button></> : <Link className="login-link" href="/login"><LogIn size={18} aria-hidden="true" /><span>تسجيل الدخول</span></Link>}
          {hasPermission(user, "machinery:create") && <Link className="btn btn-primary header-add" href="/add-machinery"><Plus aria-hidden="true" />أضف آليتك</Link>}
          <button ref={toggleRef} className="menu-toggle" type="button" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} title={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" className="mobile-menu" aria-label="قائمة الموبايل" hidden={!open}>
        {links.map(([label, href]) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>
        ))}
        {hasPermission(user, "machinery:create") && <Link href="/add-machinery" onClick={() => setOpen(false)}>أضف آليتك</Link>}
      </nav>
      {error && <p role="alert">{error}</p>}
    </header>
  );
}
