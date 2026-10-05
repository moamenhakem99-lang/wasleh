"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Send, Star, Trash2 } from "lucide-react";

type Photo = { id: string; url: string };
export function AddMachineryForm({ categories, locations, initialPhotos = [] }: { categories: {id:string; nameAr:string}[]; locations:{id:string; nameAr:string}[]; initialPhotos?: Photo[] }) {
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  async function upload(files: File[]) {
    if (busy.current || saving || !files.length) return;
    if (photos.length + files.length > 6) { setMessage("يمكن إضافة 6 صور كحد أقصى"); return; }
    if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage("اختر صور JPG أو PNG أو WebP بحجم لا يتجاوز 5 ميغابايت للصورة"); return;
    }
    busy.current = true; setUploading(true); setMessage("");
    try {
      for (const file of files) {
        const form = new FormData(); form.append("file", file);
        const response = await fetch("/api/v1/uploads", { method: "POST", body: form });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message ?? "تعذر رفع الصورة");
        setPhotos(current => [...current, { id: json.id, url: json.url }]);
      }
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "تعذر رفع الصورة"); }
    finally { busy.current = false; setUploading(false); if (input.current) input.current.value = ""; }
  }
  async function remove(photo: Photo) {
    if (busy.current || saving) return;
    busy.current = true; setUploading(true); setMessage("");
    try {
      const response = await fetch(photo.url, { method: "DELETE" });
      if (!response.ok) { const json = await response.json(); throw new Error(json.message ?? "تعذر حذف الصورة"); }
      setPhotos(current => current.filter(item => item.id !== photo.id));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "تعذر الاتصال"); }
    finally { busy.current = false; setUploading(false); }
  }
  async function submit(formData: FormData) {
    if (busy.current || saving) return;
    setSaving(true); setMessage("");
    const priceValue = String(formData.get("price") ?? "");
    const payload = {
      title: formData.get("title"), description: formData.get("description"),
      categoryId: formData.get("categoryId"), locationId: formData.get("locationId"),
      pricingType: formData.get("pricingType"), price: priceValue ? Number(priceValue) : undefined,
      condition: formData.get("condition"), canTravel: formData.get("canTravel") === "on",
      images: photos.map(photo => photo.url)
    };
    try {
      const response = await fetch("/api/v1/machinery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) { setMessage(json.message ?? "تعذر حفظ الآلية"); return; }
      router.push("/owner"); router.refresh();
    } catch { setMessage("تعذر الاتصال، حاول مجدداً"); }
    finally { setSaving(false); }
  }
  return (
    <form action={submit} className="entry-form">
      <fieldset disabled={saving || uploading}>
        <section className="form-section">
          <h2>معلومات الآلية</h2>
          <div className="form-grid">
            <label className="form-wide">اسم الآلية<input className="input" name="title" placeholder="مثال: جرار زراعي 90 حصان" minLength={3} maxLength={160} required /></label>
            <label>التصنيف<select className="input" name="categoryId" aria-label="التصنيف" required><option value="">اختر التصنيف</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}</select></label>
            <label>الموقع<select className="input" name="locationId" aria-label="الموقع" required><option value="">اختر الموقع</option>{locations.map(l => <option key={l.id} value={l.id}>{l.nameAr}</option>)}</select></label>
            <label className="form-wide">وصف الآلية<textarea className="input min-h-28" name="description" placeholder="المواصفات، التجهيزات وحالة الآلية" minLength={10} maxLength={5000} required /></label>
          </div>
        </section>
        <section className="form-section">
          <div className="form-section-heading"><h2>صور الآلية</h2><span>{photos.length} / 6</span></div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" aria-label="صور الآلية" onChange={event => upload(Array.from(event.target.files ?? []))} />
          <button type="button" className="upload-zone" disabled={photos.length >= 6} onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); upload(Array.from(event.dataTransfer.files)); }}>
            <ImagePlus size={28}/><strong>إضافة صور</strong><span>JPG، PNG، WebP · حتى 5 MB للصورة</span>
          </button>
          <div className="photo-grid">
            {photos.map((photo, index) => <div className="upload-photo" key={photo.id}>
              {/* Protected previews need the browser's session cookie. */}
              <img src={photo.url} alt={`صورة الآلية ${index + 1}`} width={240} height={180}/>
              <div className="photo-actions">
                <button type="button" className={`icon-button ${index === 0 ? "selected" : ""}`} title={index === 0 ? "الصورة الرئيسية" : "تعيين كصورة رئيسية"} aria-label={index === 0 ? "الصورة الرئيسية" : `تعيين الصورة ${index + 1} كرئيسية`} aria-pressed={index === 0} onClick={() => setPhotos(current => [photo, ...current.filter(item => item.id !== photo.id)])}><Star size={16} fill={index === 0 ? "currentColor" : "none"}/></button>
                <button type="button" className="icon-button" title="حذف الصورة" aria-label={`حذف الصورة ${index + 1}`} onClick={() => remove(photo)}><Trash2 size={16}/></button>
              </div>
            </div>)}
          </div>
        </section>
        <section className="form-section">
          <h2>السعر والتوفر</h2>
          <div className="form-grid">
            <label>طريقة التسعير<select className="input" name="pricingType" defaultValue="DAILY"><option value="HOURLY">بالساعة</option><option value="DAILY">باليوم</option><option value="PER_DUNUM">بالدونم</option><option value="PER_JOB">بالمهمة</option><option value="NEGOTIABLE">بالاتفاق</option></select></label>
            <label>السعر بالليرة السورية<input className="input" name="price" type="number" min="0" step="1" placeholder="0" /></label>
            <label>حالة الآلية<select className="input" name="condition" defaultValue="GOOD"><option value="NEW">جديدة</option><option value="VERY_GOOD">جيدة جداً</option><option value="GOOD">جيدة</option><option value="FAIR">مقبولة</option></select></label>
            <label className="check-field"><input name="canTravel" type="checkbox" />متاحة للعمل خارج موقعها</label>
          </div>
        </section>
      </fieldset>
      {uploading && <p className="form-status" role="status"><LoaderCircle size={18} className="animate-spin"/>جار معالجة الصور...</p>}
      {message && <p className="form-error" role="alert">{message}</p>}
      <div className="form-submit"><button disabled={saving || uploading} className="btn btn-primary">{saving ? <LoaderCircle className="animate-spin"/> : <Send/>}{saving ? "جار الحفظ..." : "إرسال للمراجعة"}</button></div>
    </form>
  );
}
