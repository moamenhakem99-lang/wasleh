import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, GitFork, Plus, SearchX, Sprout, Tractor, Truck, Wheat, Wind } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MachineryCard } from "@/components/machinery-card";
import { SearchPanel } from "@/components/search-panel";
import { currentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const categoryLinks = [
  { slug: "tractors", icon: Tractor },
  { slug: "harvesters", icon: Wheat },
  { slug: "plows", icon: GitFork },
  { slug: "sprayers", icon: Wind },
  { slug: "seeders", icon: Sprout },
  { slug: "transport", icon: Truck }
];

const steps = [
  { title: "اختر الآلية المناسبة", body: "ابحث حسب نوع العمل والمنطقة، وقارن بين الآليات والأسعار." },
  { title: "تواصل مع صاحبها", body: "اتصل مباشرة أو عبر واتساب، واتفق على التفاصيل والموعد." },
  { title: "أرسل طلب الحجز", body: "حدد الفترة المطلوبة، وتابع تأكيد الحجز مع صاحب الآلية." }
];

export default async function Home() {
  const canAdd = hasPermission(await currentUser(), "machinery:create");
  const [machinery, categories, locations] = await Promise.all([
    prisma.machinery.findMany({
      where: { active: true, approvalStatus: "APPROVED" },
      include: { category: true, location: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
      take: 6,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
  ]);

  return (
    <main>
      <section className="market-hero" aria-labelledby="hero-title">
        <Image src="/images/field-tractor.jpg" alt="جرار زراعي يعمل في الحقل" fill priority sizes="100vw" className="hero-photo" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><Sprout size={18} aria-hidden="true" />وصلة، أقرب لأرضك</span>
            <h1 id="hero-title">تأجير الآليات الزراعية</h1>
            <p><span className="hero-tagline">من أول حراثة لآخر حصاد.<br /></span>الآلية المناسبة، من أصحابها مباشرة.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/machinery">تصفح الآليات<ArrowLeft aria-hidden="true" /></Link>
              <Link className="btn btn-secondary" href="/how-it-works">كيف تعمل وصلة؟</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="search-band" aria-label="ابحث عن آلية في منطقتك">
        <div className="container"><SearchPanel categories={categories} locations={locations} /></div>
      </section>

      <section className="category-section" aria-labelledby="categories-title">
        <div className="container">
          <h2 id="categories-title">لكل شغلة في أرضك، آليتها</h2>
          <div className="category-grid">
            {categoryLinks.map(({ slug, icon: Icon }) => {
              const category = categories.find((item) => item.slug === slug);
              return category ? (
                <Link className="category-link" key={slug} href={`/machinery?category=${slug}`}>
                  <Icon strokeWidth={1.6} aria-hidden="true" /><span>{category.nameAr}</span>
                </Link>
              ) : null;
            })}
          </div>
        </div>
      </section>

      <section className="container listings-section" aria-labelledby="listings-title">
        <div className="section-heading">
          <div><h2 id="listings-title">آليات تنتظر شغلك</h2><p>اكتشف الآليات المعروضة، واتفق على الموعد الذي يناسبك.</p></div>
          <Link className="text-link" href="/machinery">عرض الكل<ArrowLeft size={17} aria-hidden="true" /></Link>
        </div>
        {machinery.length ? (
          <div className="grid-auto">
            {machinery.map((item) => <MachineryCard key={item.id} item={item} />)}
            {canAdd && machinery.length % 3 === 2 && (
              <aside className="owner-invitation">
                <div>
                  <Tractor size={48} strokeWidth={1.3} aria-hidden="true" />
                  <h3>عندك آلية زراعية؟</h3>
                  <p>خلّيها تشتغل أكثر، ووصّلها للمزارعين في منطقتك.</p>
                  <Link href="/add-machinery" className="btn btn-secondary"><Plus aria-hidden="true" />أضف آليتك</Link>
                </div>
              </aside>
            )}
          </div>
        ) : (
          <div className="empty-results"><SearchX size={38} /><h3>الآليات الجديدة ستظهر هنا</h3>{canAdd && <Link className="btn btn-primary" href="/add-machinery"><Plus />أضف آليتك</Link>}</div>
        )}
      </section>

      <section className="steps-section" aria-labelledby="steps-title">
        <div className="container">
          <div className="section-heading">
            <div><h2 id="steps-title">من البحث إلى الشغل، بثلاث خطوات</h2></div>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div className="step" key={step.title}>
                <span className="step-number">{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canAdd && <section className="owner-band">
        <div className="container owner-band-inner">
          <div><h2>موسم خير، وشغل أكثر لآليتك.</h2><p>انضم لأصحاب الآليات على وصلة، وابدأ باستقبال طلبات المزارعين.</p></div>
          <Link className="btn btn-gold" href="/add-machinery"><Plus aria-hidden="true" />اعرض آليتك على وصلة</Link>
        </div>
      </section>}
    </main>
  );
}
