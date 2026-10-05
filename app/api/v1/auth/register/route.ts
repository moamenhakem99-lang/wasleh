import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { ok, readJson, error } from "@/lib/api";
import { normalizePhone, setAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const { data, response } = await readJson(request, registerSchema);
  if (response) return response;
  const phone = normalizePhone(data.phone);
  const exists = await prisma.user.findUnique({ where: { phone } });
  if (exists) return error(409, "PHONE_EXISTS", "رقم الهاتف مستخدم مسبقا");
  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: data.role as Role,
      ownerProfile: data.role === "MACHINERY_OWNER" ? { create: { verificationStatus: "PENDING" } } : undefined
    }
  });
  await setAuthCookies({ id: user.id, role: user.role, phone: user.phone, name: user.name });
  return ok({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role } }, 201);
}
