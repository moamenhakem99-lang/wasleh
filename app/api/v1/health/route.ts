import { ok, error } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", database: "ok", timestamp: new Date().toISOString() });
  } catch {
    return error(503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة حاليا");
  }
}
