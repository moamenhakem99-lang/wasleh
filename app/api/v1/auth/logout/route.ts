import { ok } from "@/lib/api";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  await clearAuthCookies();
  return ok({ message: "تم تسجيل الخروج" });
}
