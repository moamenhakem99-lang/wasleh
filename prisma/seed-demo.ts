import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, ApprovalStatus, AvailabilityStatus, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo seeding is disabled in production");
  const passwordHash = await bcrypt.hash("Wasla123!", 12);
  const names = ["أحمد الحسن", "محمود العلي", "خالد العمر", "سامر الخطيب", "عمر الأحمد", "يوسف إبراهيم"];
  const businesses = ["الحسن للخدمات الزراعية", "العلي لتأجير الآليات", "العمر للحصاد", "الخطيب للآليات الزراعية", "الأحمد لخدمة المزارع", "إبراهيم للخدمات الريفية"];
  const owners = [];
  const farmers = [];
  for (let i = 0; i < names.length; i++) {
    owners.push(await prisma.user.upsert({
      where: { id: `demo-v2-owner-${i}` }, update: {},
      create: { id: `demo-v2-owner-${i}`, name: names[i], phone: `+96390001010${i}`, passwordHash, role: "MACHINERY_OWNER", ownerProfile: { create: { businessName: businesses[i], verificationStatus: i % 3 === 0 ? "PENDING" : "VERIFIED" } } }
    }));
    farmers.push(await prisma.user.upsert({
      where: { id: `demo-v2-farmer-${i}` }, update: {},
      create: { id: `demo-v2-farmer-${i}`, name: ["محمد صالح", "حسن دياب", "فراس عثمان", "زياد مصطفى", "مازن إسماعيل", "باسل مراد"][i], phone: `+96390001020${i}`, passwordHash, role: "FARMER" }
    }));
  }
  const entries = [
    ["جرار للحراثة وتجهيز الأراضي", "tractors", "gov-3", 320000, "APPROVED"],
    ["حصادة قمح وشعير", "harvesters", "gov-12", 420000, "APPROVED"],
    ["جرار زراعي للأعمال اليومية", "tractors", "gov-8", 275000, "APPROVED"],
    ["حصادة مع فريق تشغيل", "harvesters", "gov-11", 510000, "APPROVED"],
    ["جرار مع مقطورة زراعية", "tractors", "gov-4", 380000, "APPROVED"],
    ["جرار صغير لخدمة البساتين", "tractors", "gov-7", 210000, "APPROVED"],
    ["جرار وتجهيزات للحراثة العميقة", "tractors", "gov-1", 365000, "PENDING"],
    ["حصادة جاهزة للموسم القادم", "harvesters", "gov-3", 460000, "PENDING"],
    ["جرار لخدمة المزارع الصغيرة", "tractors", "gov-9", 230000, "PENDING"],
    ["حصادة آلية مع سائق", "harvesters", "gov-10", 495000, "APPROVED"],
    ["جرار زراعي متعدد الاستخدامات", "tractors", "gov-5", 290000, "REJECTED"],
    ["جرار لتحضير التربة", "tractors", "gov-2", 305000, "APPROVED"]
  ] as const;
  const machines = [];
  for (const [index, [title, categorySlug, locationSlug, price, approvalStatus]] of entries.entries()) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: categorySlug } });
    const location = await prisma.location.findUniqueOrThrow({ where: { slug: locationSlug } });
    const id = `demo-v2-machine-${index}`;
    const machine = await prisma.machinery.upsert({
      where: { id }, update: {},
      create: { id, slug: `demo-v2-${categorySlug}-${index}`, title, description: "عرض تجريبي لاختبار منصة وصلة، وليس إعلاناً حقيقياً. خدمة زراعية مع إمكانية الاتفاق على الموعد ومساحة العمل ومكان التسليم. الصورة توضيحية وليست صورة الآلية الفعلية.", ownerId: owners[index % owners.length].id, categoryId: category.id, locationId: location.id, price, pricingType: "DAILY", condition: "VERY_GOOD", approvalStatus: approvalStatus as ApprovalStatus, availabilityStatus: (index === 3 || index === 5 ? "BUSY" : "AVAILABLE") as AvailabilityStatus, canTravel: index % 2 === 0, serviceRadiusKm: 30 + index * 5, images: { create: { url: categorySlug === "tractors" ? "/images/field-tractor.jpg" : "/images/harvester-demo.jpg", isPrimary: true } } }
    });
    machines.push(machine);
  }
  const approved = machines.filter(machine => machine.approvalStatus === "APPROVED");
  const states: BookingStatus[] = ["PENDING", "ACCEPTED", "COMPLETED", "REJECTED", "CANCELLED", "COMPLETED"];
  for (let i = 0; i < 18; i++) {
    const machine = approved[i % approved.length];
    const farmer = farmers[i % farmers.length];
    const status = states[i % states.length];
    const booking = await prisma.booking.upsert({
      where: { id: `demo-v2-booking-${i}` }, update: {},
      create: { id: `demo-v2-booking-${i}`, machineryId: machine.id, farmerId: farmer.id, status, startDate: new Date(Date.UTC(2026, 10, i + 1, 7)), endDate: new Date(Date.UTC(2026, 10, i + 1, 17)), notes: "طلب تجريبي لاختبار لوحة الإدارة", quotedPrice: machine.price }
    });
    if (booking.status === "COMPLETED") await prisma.review.upsert({
      where: { bookingId: booking.id }, update: {},
      create: { bookingId: booking.id, machineryId: machine.id, farmerId: farmer.id, rating: i % 2 ? 5 : 4, comment: "تقييم تجريبي: التزام بالمواعيد وتواصل واضح." }
    });
  }
  for (const machine of machines) {
    const stats = await prisma.review.aggregate({ where: { machineryId: machine.id, hidden: false }, _avg: { rating: true }, _count: true });
    await prisma.machinery.update({ where: { id: machine.id }, data: { averageRating: stats._avg.rating ?? 0, reviewCount: stats._count } });
  }
  console.log("Demo data ready: 6 owners, 6 farmers, 12 machines, 18 bookings, 6 reviews. Existing records preserved.");
}
main().finally(() => prisma.$disconnect()).catch(error => { console.error(error); process.exitCode = 1; });
