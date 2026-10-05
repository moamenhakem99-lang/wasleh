import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ChevronLeft, RotateCcw, SearchX, SlidersHorizontal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MachineryCard } from "@/components/machinery-card";
import { SearchPanel } from "@/components/search-panel";

export const dynamic = "force-dynamic";

export default async function MachineryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const where: Prisma.MachineryWhereInput = { active: true, approvalStatus: "APPROVED" };
  if (params.q?.trim()) where.OR = [
    { title: { contains: params.q.trim(), mode: "insensitive" } },
    { description: { contains: params.q.trim(), mode: "insensitive" } }
  ];
  if (params.category) where.category = { slug: params.category };
  if (params.location) {
    // Selecting a governorate also includes its districts and villages.
    where.location = { OR: [
      { slug: params.location },
      { parent: { slug: params.location } },
      { parent: { parent: { slug: params.location } } }
    ] };
  }
  if (params.canTravel === "on") where.canTravel = true;
  const orderBy: Prisma.MachineryOrderByWithRelationInput = params.sort === "price-asc"
    ? { price: { sort: "asc", nulls: "last" } }
    : params.sort === "price-desc"
      ? { price: { sort: "desc", nulls: "last" } }
      : params.sort === "rating" ? { averageRating: "desc" } : { createdAt: "desc" };
  const [items, categories, locations] = await Promise.all([
    prisma.machinery.findMany({ where, include: { category: true, location: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } }, orderBy }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
  ]);
  const activeFilters = [
    params.q,
    categories.find(c => c.slug === params.category)?.nameAr,
    locations.find(l => l.slug === params.location)?.nameAr,
    params.canTravel === "on" ? "يمكنها التنقل" : undefined
  ].filter(Boolean);

  return (
    <main>
      <section className="catalog-header">
        <div className="container">
          <nav className="breadcrumb" aria-label="مسار الصفحة"><Link href="/">الرئيسية</Link><ChevronLeft size={14} /><span>الآليات الزراعية</span></nav>
          <h1>آلية لكل شغلة في أرضك</h1>
          <p>قارن الخيارات، واعرف السعر، وتواصل مباشرة مع صاحب الآلية.</p>
          <SearchPanel key={JSON.stringify(params)} categories={categories} locations={locations} values={params} />
        </div>
      </section>
      <section className="container catalog-results" aria-label="نتائج البحث">
        <div className="results-toolbar">
          <p className="results-count"><strong>{items.length}</strong> آلية مطابقة</p>
          <form className="sort-form" action="/machinery" aria-label="ترتيب النتائج">
            {["q", "category", "location"].map(key => params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null)}
            <select key={params.sort ?? ""} className="input" name="sort" aria-label="ترتيب حسب" defaultValue={params.sort ?? ""}>
              <option value="">الأحدث أولا</option>
              <option value="price-asc">السعر: الأقل أولا</option>
              <option value="price-desc">السعر: الأعلى أولا</option>
              <option value="rating">الأعلى تقييما</option>
            </select>
            <label><input key={params.canTravel ?? ""} type="checkbox" name="canTravel" defaultChecked={params.canTravel === "on"} />يمكنها التنقل</label>
            <button className="btn btn-secondary" type="submit"><SlidersHorizontal size={15} />تطبيق</button>
          </form>
        </div>
        {activeFilters.length > 0 && <div className="active-filters">
          {activeFilters.map((label, index) => <span className="active-filter" key={index}>{label}</span>)}
          <Link href="/machinery" className="text-link"><RotateCcw size={14} />مسح الفلاتر</Link>
        </div>}
        {items.length ? <div className="grid-auto">{items.map(item => <MachineryCard key={item.id} item={item} />)}</div> : (
          <div className="empty-results">
            <SearchX size={42} strokeWidth={1.5} />
            <h2>لم نجد آليات مطابقة لبحثك</h2>
            <p>جرّب منطقة أخرى أو غيّر نوع الآلية المطلوبة.</p>
            <Link href="/machinery" className="btn btn-secondary"><RotateCcw size={17} />عرض جميع الآليات</Link>
          </div>
        )}
      </section>
    </main>
  );
}
