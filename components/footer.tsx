import Image from "next/image";
import Link from "next/link";
import type { AuthUser } from "@/lib/auth";
import { hasPermission, accountHome } from "@/lib/permissions";

export function Footer({ user }: { user: AuthUser | null }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-about">
          <Link href="/" className="brand" aria-label="وصلة - الرئيسية">
            <Image src="/logo.png" alt="" width={58} height={58} className="brand-image" />
            <span><span className="brand-name">وصلة</span><span className="brand-caption">أقرب لأرضك</span></span>
          </Link>
          <p>نصل المزارعين بأصحاب الآليات الزراعية.<br />تواصل مباشر، وخيارات أوضح لموسم أفضل.</p>
        </div>
        <div className="footer-links">
          <h3>اكتشف وصلة</h3>
          <Link href="/machinery">الآليات الزراعية</Link>
          {hasPermission(user, "machinery:create") && <Link href="/add-machinery">أضف آليتك</Link>}
          <Link href="/how-it-works">كيف تعمل وصلة</Link>
        </div>
        <div className="footer-links">
          <h3>نحن معك</h3>
          <Link href="/about">عن وصلة</Link>
          <Link href="/contact">تواصل معنا</Link>
          <Link href={user ? accountHome(user) : "/login"}>حسابي</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} وصلة. جميع الحقوق محفوظة.</span>
        <div className="footer-bottom-links"><Link href="/privacy">سياسة الخصوصية</Link><Link href="/terms">الشروط والأحكام</Link></div>
      </div>
    </footer>
  );
}
