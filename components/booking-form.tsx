"use client";
import { useState } from "react";

export function BookingForm({ machineryId }: { machineryId: string }) {
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    const payload = { machineryId, startDate: new Date(String(formData.get("startDate"))).toISOString(), endDate: new Date(String(formData.get("endDate"))).toISOString(), notes: formData.get("notes") };
    const res = await fetch("/api/v1/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    setMessage(res.ok ? "تم إرسال طلب الحجز بنجاح" : json.message ?? "تعذر إرسال الطلب");
  }
  return <form action={submit} className="card mx-auto max-w-xl space-y-4 p-5"><h1 className="text-2xl font-extrabold">طلب حجز</h1><input className="input" name="startDate" type="datetime-local" required/><input className="input" name="endDate" type="datetime-local" required/><textarea className="input" name="notes" placeholder="ملاحظات للمؤجر"/><button className="btn btn-primary w-full">إرسال طلب الحجز</button>{message && <p>{message}</p>}</form>;
}
