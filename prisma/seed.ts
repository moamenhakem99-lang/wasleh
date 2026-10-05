import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Wasla123!", 12);
  const [admin, owner, farmer] = await Promise.all([
    prisma.user.upsert({
      where: { phone: "+963900000001" },
      update: {},
      create: { name: "مدير وصلة", phone: "+963900000001", email: "admin@wasla.local", passwordHash, role: Role.SUPER_ADMIN }
    }),
    prisma.user.upsert({
      where: { phone: "+963900000002" },
      update: {},
      create: { name: "أبو خالد للآليات", phone: "+963900000002", email: "owner@wasla.local", passwordHash, role: Role.MACHINERY_OWNER }
    }),
    prisma.user.upsert({
      where: { phone: "+963900000003" },
      update: {},
      create: { name: "مزارع تجريبي", phone: "+963900000003", email: "farmer@wasla.local", passwordHash, role: Role.FARMER }
    })
  ]);

  await prisma.ownerProfile.upsert({
    where: { userId: owner.id },
    update: { verificationStatus: "VERIFIED", businessName: "أبو خالد لتأجير الجرارات" },
    create: { userId: owner.id, verificationStatus: "VERIFIED", businessName: "أبو خالد لتأجير الجرارات", canTravelDefault: true }
  });

  const governorates = ["دمشق", "ريف دمشق", "حمص", "حماة", "حلب", "إدلب", "اللاذقية", "طرطوس", "درعا", "السويداء", "دير الزور", "الحسكة", "الرقة", "القنيطرة"];
  for (const [i, name] of governorates.entries()) {
    await prisma.location.upsert({
      where: { slug: `gov-${i}` },
      update: {},
      create: { nameAr: name, slug: `gov-${i}`, type: "GOVERNORATE", sortOrder: i }
    });
  }
  const homs = await prisma.location.findFirstOrThrow({ where: { nameAr: "حمص" } });
  const east = await prisma.location.upsert({
    where: { slug: "homs-east-countryside" },
    update: {},
    create: { nameAr: "ريف حمص الشرقي", slug: "homs-east-countryside", type: "DISTRICT", parentId: homs.id, sortOrder: 1 }
  });
  const village = await prisma.location.upsert({
    where: { slug: "al-mukharram" },
    update: {},
    create: { nameAr: "المخرم", slug: "al-mukharram", type: "VILLAGE", parentId: east.id, sortOrder: 1 }
  });

  const categories = [
    ["جرارات زراعية", "tractors", "Tractor"],
    ["حصادات", "harvesters", "Combine"],
    ["حفارات", "excavators", "Shovel"],
    ["آليات استصلاح الأراضي", "land-reclamation", "Landmark"],
    ["مرشات", "sprayers", "Sprout"],
    ["عزاقات", "tillers", "Wrench"],
    ["محاريث", "plows", "GitBranch"],
    ["بذارات", "seeders", "Wheat"],
    ["آليات نقل", "transport", "Truck"],
    ["معدات زراعية أخرى", "other-equipment", "Boxes"]
  ];
  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c[1] },
      update: {},
      create: { nameAr: c[0], slug: c[1], icon: c[2], description: `تصنيف ${c[0]} في وصلة`, sortOrder: i }
    });
  }

  const tractor = await prisma.category.findUniqueOrThrow({ where: { slug: "tractors" } });
  const harvester = await prisma.category.findUniqueOrThrow({ where: { slug: "harvesters" } });
  const machinerySeeds = [
    { title: "جرار زراعي 90 حصان مع محاريث", slug: "tractor-90-hp-homs", categoryId: tractor.id, price: 250000, pricingType: "DAILY" as const, horsePower: 90 },
    { title: "حصادة قمح جاهزة للموسم", slug: "wheat-harvester-homs", categoryId: harvester.id, price: 950000, pricingType: "PER_DUNUM" as const, horsePower: 160 }
  ];
  for (const item of machinerySeeds) {
    const machine = await prisma.machinery.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        ownerId: owner.id,
        categoryId: item.categoryId,
        locationId: village.id,
        title: item.title,
        slug: item.slug,
        description: "آلية بحالة جيدة متاحة للتأجير ضمن ريف حمص، مع إمكانية التنسيق المباشر عبر الهاتف أو واتساب.",
        brand: "Massey Ferguson",
        model: "MF",
        horsePower: item.horsePower,
        pricingType: item.pricingType,
        price: item.price,
        canTravel: true,
        serviceRadiusKm: 35,
        approvalStatus: "APPROVED",
        featured: true,
        averageRating: 4.8,
        reviewCount: 1
      }
    });
    await prisma.machineryImage.upsert({
      where: { id: `${machine.id}-cover` },
      update: {},
      create: { id: `${machine.id}-cover`, machineryId: machine.id, url: "/images/machinery-placeholder.svg", isPrimary: true }
    });
  }

  const firstMachine = await prisma.machinery.findFirstOrThrow();
  const booking = await prisma.booking.upsert({
    where: { id: "dev-booking-completed" },
    update: {},
    create: {
      id: "dev-booking-completed",
      farmerId: farmer.id,
      machineryId: firstMachine.id,
      startDate: new Date("2026-05-10T08:00:00.000Z"),
      endDate: new Date("2026-05-11T08:00:00.000Z"),
      status: "COMPLETED",
      quotedPrice: firstMachine.price
    }
  });
  await prisma.review.upsert({
    where: { bookingId: booking.id },
    update: {},
    create: { bookingId: booking.id, farmerId: farmer.id, machineryId: firstMachine.id, rating: 5, comment: "تواصل سريع والآلية وصلت في الوقت المتفق عليه." }
  });

  await prisma.setting.upsert({ where: { key: "platformName" }, update: { value: "وصلة" }, create: { key: "platformName", value: "وصلة" } });
  await prisma.setting.upsert({ where: { key: "defaultCurrency" }, update: { value: "SYP" }, create: { key: "defaultCurrency", value: "SYP" } });
}

main().finally(async () => prisma.$disconnect());
