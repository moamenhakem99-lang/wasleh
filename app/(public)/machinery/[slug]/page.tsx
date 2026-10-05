import { MachineryGallery } from "@/components/machinery-gallery";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Phone, MessageCircle, MapPin, Star, ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { availabilityLabels, priceText } from "@/lib/format";
import { machineryCover } from "@/lib/machinery-image";
import { currentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { decodeMachinerySlug } from "@/lib/machinery-slug";

export const dynamic = "force-dynamic";

export default async function DetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: encodedSlug } = await params;
  const slug = decodeMachinerySlug(encodedSlug);
  if (!slug) notFound();
  const user = await currentUser();
  const item = await prisma.machinery.findUnique({ where: { slug }, include: { category: true, location: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] }, owner: { include: { ownerProfile: true } }, reviews: { where: { hidden: false }, include: { farmer: true } } } });
  if (!item || !item.active || item.approvalStatus !== "APPROVED") notFound();
  const cover = machineryCover(item);
  const badge = item.availabilityStatus === "AVAILABLE" ? "badge-green" : item.availabilityStatus === "BUSY" ? "badge-gold" : "badge-red";
  const phone = item.owner.phone;
  return (
    <main className="container grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
      <section>
        <MachineryGallery title={item.title} illustrative={cover.illustrative} images={cover.illustrative ? [cover.src!] : item.images.map(image => image.url).filter(url => url !== "/images/machinery-placeholder.svg")} />
        <div className="mt-6">
          <span className={`badge ${badge}`}>{availabilityLabels[item.availabilityStatus]}</span>
          <h1 className="mt-3 text-3xl font-extrabold">{item.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-[#647067]"><MapPin size={18}/>{item.location.nameAr} · {item.category.nameAr}</p>
          <p className="mt-5 leading-8">{item.description}</p>
        </div>
        <section className="mt-8"><h2 className="mb-3 text-xl font-extrabold">التقييمات</h2>{item.reviews.length ? item.reviews.map(r => <div className="card mb-3 p-4" key={r.id}><b>{r.farmer.name}</b><p className="text-[#647067]">{r.comment}</p></div>) : <p className="text-[#647067]">لا توجد تقييمات بعد.</p>}</section>
      </section>
      <aside className="card h-fit p-5">
        <p className="text-2xl font-extrabold text-[#0B5D3B]">{priceText(item.price, item.pricingType, item.currency)}</p>
        <p className="mt-3 flex items-center gap-1"><Star size={18} fill="#E5A817" color="#E5A817"/> {item.averageRating.toFixed(1)} من {item.reviewCount} تقييم</p>
        {item.owner.ownerProfile?.verificationStatus === "VERIFIED" && <p className="badge badge-green mt-4">مالك موثق</p>}
        <div className="mt-5 grid gap-2">
          <a className="btn btn-primary" href={`tel:${phone}`}><Phone size={18}/>اتصال</a>
          <a className="btn btn-gold" href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}><MessageCircle size={18}/>واتساب</a>
          {item.availabilityStatus === "AVAILABLE" && item.ownerId !== user?.id && (!user || hasPermission(user, "bookings:create")) && <Link className="btn btn-secondary" href={`/book?machineryId=${item.id}`}><Calendar size={18}/>طلب حجز</Link>}
        </div>
      </aside>
    </main>
  );
}
