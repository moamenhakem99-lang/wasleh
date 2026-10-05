import Link from "next/link";

export default function NotFound() {
  return <main className="container py-20 text-center"><h1 className="text-4xl font-extrabold">الصفحة غير موجودة</h1><Link className="btn btn-primary mt-6" href="/">العودة للرئيسية</Link></main>;
}
