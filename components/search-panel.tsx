import { MapPin, Search, Tractor } from "lucide-react";

export type SearchValues = { q?: string; category?: string; location?: string; sort?: string; canTravel?: string };

export function SearchPanel({
  categories,
  locations,
  values = {}
}: {
  categories: { slug: string; nameAr: string }[];
  locations: { slug: string; nameAr: string; type: string }[];
  values?: SearchValues;
}) {
  return (
    <form action="/machinery" className="search-form" aria-label="البحث عن الآليات">
      <label className="search-field search-keyword">
        <span className="search-field-label"><Search size={15} aria-hidden="true" />عن أي آلية تبحث؟</span>
        <input className="input" type="search" name="q" defaultValue={values.q ?? ""} placeholder="اسم الآلية أو نوع الخدمة" />
      </label>
      <label className="search-field">
        <span className="search-field-label"><Tractor size={15} aria-hidden="true" />نوع الآلية</span>
        <select className="input" name="category" defaultValue={values.category ?? ""}>
          <option value="">جميع الآليات</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.nameAr}</option>)}
        </select>
      </label>
      <label className="search-field">
        <span className="search-field-label"><MapPin size={15} aria-hidden="true" />المحافظة أو المنطقة</span>
        <select className="input" name="location" defaultValue={values.location ?? ""}>
          <option value="">جميع المناطق</option>
          {locations.map((location) => <option key={location.slug} value={location.slug}>{location.nameAr}</option>)}
        </select>
      </label>
      {values.sort && <input type="hidden" name="sort" value={values.sort} />}
      {values.canTravel === "on" && <input type="hidden" name="canTravel" value="on" />}
      <button className="btn btn-primary search-submit" type="submit"><Search aria-hidden="true" />ابحث عن آلية</button>
    </form>
  );
}
