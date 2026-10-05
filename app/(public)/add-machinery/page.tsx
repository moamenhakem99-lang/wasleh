import { prisma } from "@/lib/prisma";
import { AddMachineryForm } from "@/components/add-machinery-form";
import { requirePagePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AddMachineryPage() {
  const user = await requirePagePermission("machinery:create", "/add-machinery");
  const [categories, locations, uploads] = await Promise.all([
    prisma.category.findMany({ where: { active: true } }), prisma.location.findMany({ where: { active: true } }),
    prisma.upload.findMany({ where: { userId: user.id, machineryId: null }, take: 6, orderBy: { createdAt: "asc" }, select: { id: true } })
  ]);
  return <main className="container max-w-3xl py-8"><h1 className="mb-5 text-3xl font-extrabold">أضف آليتك</h1><AddMachineryForm categories={categories} locations={locations} initialPhotos={uploads.map(photo => ({ id: photo.id, url: `/api/v1/uploads/${photo.id}` }))} /></main>;
}
