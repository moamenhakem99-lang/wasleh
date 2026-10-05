import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main className="container py-8"><AuthForm mode="login" returnTo={next} /><p className="mt-4 text-center">ليس لديك حساب؟ <Link className="font-bold text-[#0B5D3B]" href="/register">إنشاء حساب</Link></p></main>;
}
