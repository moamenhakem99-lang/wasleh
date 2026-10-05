import { ImageOff, Check, X } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { machineryCover } from "@/lib/machinery-image";
import { approvalLabels } from "@/lib/admin-format";

type Item = { id: string; slug: string; title: string; description: string; approvalStatus: string; owner: { name: string }; category: { nameAr: string }; location: { nameAr: string }; images: { url: string }[] };
export function AdminMachineryTable({ items }: { items: Item[] }) {
  return items.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>الآلية</th><th>المالك</th><th>الموقع</th><th>الحالة</th><th>المراجعة</th></tr></thead><tbody>{items.map(item => {
    const cover = machineryCover(item);
    return <tr key={item.id}><td><div className="admin-machine-cell">{cover.src ? <img src={cover.src} alt="" width={68} height={52}/> : <span className="admin-no-photo"><ImageOff size={22}/></span>}<div><b>{item.title}</b><small>{item.category.nameAr}</small></div></div></td><td>{item.owner.name}</td><td>{item.location.nameAr}</td><td><span className={`badge ${item.approvalStatus === "APPROVED" ? "badge-green" : item.approvalStatus === "PENDING" ? "badge-gold" : "badge-red"}`}>{approvalLabels[item.approvalStatus]}</span></td><td><details className="review-details"><summary>التفاصيل</summary><p>{item.description}</p><div className="review-photos">{item.images.filter(image => image.url !== "/images/machinery-placeholder.svg").map(image => <a key={image.url} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={item.title} width={120} height={90}/></a>)}</div>{item.approvalStatus === "PENDING" && <div className="review-actions"><ActionButton url={`/api/v1/admin/machinery/${item.id}/approve`} label="اعتماد" className="btn btn-primary" icon={<Check size={16}/>}/><ActionButton url={`/api/v1/admin/machinery/${item.id}/reject`} label="رفض" icon={<X size={16}/>}/></div>}</details></td></tr>;
  })}</tbody></table></div> : <div className="admin-empty"><ImageOff size={28}/><p>لا توجد آليات مطابقة.</p></div>;
}
