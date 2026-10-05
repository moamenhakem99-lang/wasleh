import bcrypt from "bcryptjs";
import { ok, readJson, error } from "@/lib/api";
import { normalizePhone, setAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const { data, response } = await readJson(request, loginSchema);
  if (response) return response;
  const user = await prisma.user.findUnique({ where: { phone: normalizePhone(data.phone) } });
  if (!user || !user.active || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return error(401, "INVALID_CREDENTIALS", "رقم الهاتف أو كلمة المرور غير صحيحة");
  }
  await setAuthCookies({ id: user.id, role: user.role, phone: user.phone, name: user.name });
  return ok({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
}
