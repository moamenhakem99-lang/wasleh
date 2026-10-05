"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export function MachineryGallery({ images, title, illustrative }: { images: string[]; title: string; illustrative: boolean }) {
  const [selected, setSelected] = useState(0);
  return <div>
    <div className="card relative aspect-[16/10] overflow-hidden">
      {images.length ? <Image src={images[selected]} unoptimized={images[selected].startsWith("/api/v1/uploads/")} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 780px" className="object-cover"/> : <div className="empty-photo"><ImageOff size={40}/><span>لا توجد صورة للآلية</span></div>}
      {illustrative && <span className="illustrative-label">صورة توضيحية لبيانات تجريبية</span>}
    </div>
    {images.length > 1 && <div className="gallery-thumbnails">{images.map((url, index) => <button type="button" key={url} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><img src={url} alt="" width={100} height={72}/></button>)}</div>}
  </div>;
}
