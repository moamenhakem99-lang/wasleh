import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageOff, MapPin, Star } from "lucide-react";
import { availabilityLabels, pricingLabels } from "@/lib/format";
import { machineryCover } from "@/lib/machinery-image";

type CardItem = {
  slug: string;
  title: string;
  price: number | null;
  pricingType: string;
  currency: string;
  averageRating: number;
  reviewCount?: number;
  availabilityStatus: string;
  category: { nameAr: string };
  location: { nameAr: string };
  images: { url: string }[];
};

export function MachineryCard({ item }: { item: CardItem }) {
  const cover = machineryCover(item);
  const badge = item.availabilityStatus === "AVAILABLE" ? "badge-green" : item.availabilityStatus === "BUSY" ? "badge-gold" : "badge-red";
  const href = `/machinery/${item.slug}`;

  return (
    <article className="card machine-card">
      <Link href={href} className="machine-cover" aria-label={item.title}>
        {cover.src ? (
          <Image src={cover.src} unoptimized={cover.src.startsWith("/api/v1/uploads/")} alt={cover.illustrative ? `صورة توضيحية: ${item.category.nameAr}` : item.title} fill sizes="(max-width: 640px) calc(100vw - 36px), (max-width: 900px) 50vw, 390px" />
        ) : <div className="empty-photo"><ImageOff size={30} /><span>لا توجد صورة للآلية</span></div>}
        <div className="cover-badges"><span className={`badge ${badge}`}>{availabilityLabels[item.availabilityStatus]}</span></div>
        {cover.illustrative && <span className="illustrative-label">صورة توضيحية</span>}
      </Link>
      <div className="machine-body">
        <div className="machine-meta">
          <span>{item.category.nameAr}</span>
          {(item.reviewCount ?? 0) > 0 && <span className="machine-rating"><Star size={13} aria-hidden="true" />{item.averageRating.toFixed(1)} <span>({item.reviewCount})</span></span>}
        </div>
        <h3 className="machine-title"><Link href={href}>{item.title}</Link></h3>
        <p className="machine-location"><MapPin size={14} aria-hidden="true" />{item.location.nameAr}</p>
        <div className="machine-footer">
          <p className="machine-price">
            {item.price && item.pricingType !== "NEGOTIABLE" ? <>{new Intl.NumberFormat("ar-SY").format(item.price)} <small>{item.currency === "SYP" ? "ل.س" : item.currency}<br />{pricingLabels[item.pricingType]}</small></> : "السعر بالاتفاق"}
          </p>
          <Link className="btn btn-secondary" href={href}>التفاصيل<ArrowLeft aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}
