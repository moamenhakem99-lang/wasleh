import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { requirePermission, normalizePhone } from "@/lib/auth";
import { readJson, ok, error } from "@/lib/api";
import { ownerSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = await requirePermission("owners:create");
  if (auth.response) return auth.response;
  const { data, response } = await readJson(request, ownerSchema);
  if (response) return response;
  const phone = normalizePhone(data.phone);
  if (!/^\+?\d{7,15}$/.test(phone)) return error(400, "INVALID_PHONE", "أدخل رقم هاتف صحيحاً مع رمز الدولة");
  try {
    const owner = await prisma.user.create({
      data: { name: data.name, phone, passwordHash: await bcrypt.hash(data.password, 12), role: "MACHINERY_OWNER", ownerProfile: { create: { businessName: data.businessName, verificationStatus: data.verified ? "VERIFIED" : "PENDING" } } },
      select: { id: true, name: true, phone: true, role: true }
    });
    return ok({ owner }, 201);
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") return error(409, "PHONE_EXISTS", "رقم الهاتف مستخدم مسبقاً");
    throw cause;
  }
}
