import { Prisma } from "@prisma/client";
import { ok, pageParams, readJson, error } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { machinerySchema, slugify } from "@/lib/schemas";

const include = { category: true, location: true, images: { orderBy: { sortOrder: "asc" as const } }, owner: { select: { id: true, name: true, phone: true, ownerProfile: true } } };

export async function GET(request: Request) {
  const { search, page, pageSize, skip } = pageParams(request.url);
  const where: Prisma.MachineryWhereInput = { active: true, approvalStatus: "APPROVED" };
  const q = search.get("q");
  const category = search.get("category");
  const location = search.get("location");
  const pricingType = search.get("pricingType");
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];
  if (category) where.category = { slug: category };
  if (location) where.location = { OR: [{ slug: location }, { parent: { slug: location } }] };
  if (pricingType) where.pricingType = pricingType as never;
  if (search.get("canTravel") === "true") where.canTravel = true;
  const sort = search.get("sort");
  const orderBy: Prisma.MachineryOrderByWithRelationInput =
    sort === "price-asc" ? { price: "asc" } : sort === "price-desc" ? { price: "desc" } : sort === "rating" ? { averageRating: "desc" } : { createdAt: "desc" };
  const [items, total] = await Promise.all([
    prisma.machinery.findMany({ where, include, orderBy, skip, take: pageSize }),
    prisma.machinery.count({ where })
  ]);
  return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: Request) {
  const auth = await requirePermission("machinery:create");
  if (auth.response) return auth.response;
  const { data, response } = await readJson(request, machinerySchema);
  if (response) return response;
  const baseSlug = slugify(data.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const [category, location] = await Promise.all([
    prisma.category.findFirst({ where: { id: data.categoryId, active: true } }),
    prisma.location.findFirst({ where: { id: data.locationId, active: true } })
  ]);
  if (!category || !location) return error(400, "INVALID_REFERENCE", "اختر تصنيفاً وموقعاً متاحين");
  try {
  const machinery = await prisma.$transaction(async tx => {
    const item = await tx.machinery.create({
    data: {
      ...data,
      slug,
      ownerId: auth.user.id,
      currency: process.env.DEFAULT_CURRENCY ?? "SYP",
      images: { create: data.images.map((url, i) => ({ url, isPrimary: i === 0, sortOrder: i })) }
    },
    include
  });
    const linked = await tx.upload.updateMany({
      where: { id: { in: data.images.map(url => url.split("/").at(-1)!) }, userId: auth.user.id, machineryId: null },
      data: { machineryId: item.id }
    });
    if (linked.count !== data.images.length) throw new Error("INVALID_UPLOADS");
    return item;
  });
  return ok({ item: machinery }, 201);
  } catch (cause) {
    if (cause instanceof Error && cause.message === "INVALID_UPLOADS") return error(400, "INVALID_UPLOADS", "بعض الصور غير متاحة أو ليست مرفوعة من حسابك");
    throw cause;
  }
}
