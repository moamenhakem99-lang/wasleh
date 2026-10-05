"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UsersRound, Tractor, CalendarDays, ArrowUpLeft } from "lucide-react";

const links = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/owners", label: "ملاك الآليات", icon: UsersRound },
  { href: "/admin/machinery", label: "الآليات والمراجعات", icon: Tractor },
  { href: "/admin/bookings", label: "الحجوزات", icon: CalendarDays }
];
export function AdminNav() {
  const pathname = usePathname();
  return <nav className="admin-nav" aria-label="الإدارة">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={(href === "/admin" ? pathname === href : pathname.startsWith(href)) ? "page" : undefined}><Icon size={19}/><span>{label}</span></Link>)}<Link href="/" className="admin-market-link"><ArrowUpLeft size={19}/><span>زيارة الموقع</span></Link></nav>;
}
