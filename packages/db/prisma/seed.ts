import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  UserRole,
  StationType,
  LanguageCode,
  TableStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";

const prisma = new PrismaClient();

// Demo şifre — yalnız geliştirme. Üretimde ASLA bu şifreleri kullanma.
const DEMO_PASSWORD = "Demo!2026";

async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

function qrToken(): string {
  // Kısa, URL güvenli token
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

async function main(): Promise<void> {
  console.log("Seeding…");

  // ── Subscription plans (referans tablosu) ──
  await prisma.subscriptionPlanRef.createMany({
    data: [
      {
        code: SubscriptionPlan.STARTER,
        name: "Başlangıç",
        maxBranches: 1,
        maxTables: 10,
        maxProducts: 50,
        maxUsers: 5,
        monthlyPrice: 499,
        yearlyPrice: 4990,
        features: { campaigns: false, reports: "basic" },
      },
      {
        code: SubscriptionPlan.PROFESSIONAL,
        name: "Profesyonel",
        maxBranches: 3,
        maxTables: -1,
        maxProducts: 500,
        maxUsers: 25,
        monthlyPrice: 1499,
        yearlyPrice: 14990,
        features: { campaigns: true, reports: "advanced" },
      },
      {
        code: SubscriptionPlan.ENTERPRISE,
        name: "Kurumsal",
        maxBranches: -1,
        maxTables: -1,
        maxProducts: -1,
        maxUsers: -1,
        monthlyPrice: 3999,
        yearlyPrice: 39990,
        features: { campaigns: true, reports: "advanced", customSupport: true },
      },
    ],
    skipDuplicates: true,
  });

  // ── Süper admin ──
  await prisma.superAdmin.upsert({
    where: { email: "admin@sistemadi.com" },
    update: {},
    create: {
      email: "admin@sistemadi.com",
      fullName: "Sistem Yöneticisi",
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });

  // ── Demo tenant ──
  const tenant = await prisma.tenant.upsert({
    where: { slug: "lezzetkosesi" },
    update: {},
    create: {
      name: "Lezzet Köşesi A.Ş.",
      slug: "lezzetkosesi",
      ownerEmail: "sahip@lezzetkosesi.com",
      phone: "+90 555 000 00 00",
    },
  });

  // ── Abonelik ──
  await prisma.subscription.upsert({
    where: { id: tenant.id },
    update: {},
    create: {
      id: tenant.id,
      tenantId: tenant.id,
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      startsAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ── Restoran ──
  const restaurant = await prisma.restaurant.create({
    data: {
      tenantId: tenant.id,
      name: "Lezzet Köşesi - Merkez",
      address: "İstanbul, Türkiye",
      phone: "+90 555 000 00 01",
      vatRate: 10,
      serviceFee: 0,
      defaultLang: LanguageCode.TR,
      openingHours: {
        mon: [{ open: "10:00", close: "23:00" }],
        tue: [{ open: "10:00", close: "23:00" }],
        wed: [{ open: "10:00", close: "23:00" }],
        thu: [{ open: "10:00", close: "23:00" }],
        fri: [{ open: "10:00", close: "00:00" }],
        sat: [{ open: "10:00", close: "00:00" }],
        sun: [{ open: "10:00", close: "23:00" }],
      },
    },
  });

  // ── Salonlar ──
  const [iceSalon, bahce, teras] = await Promise.all([
    prisma.section.create({
      data: { tenantId: tenant.id, restaurantId: restaurant.id, name: "İç Salon", sortOrder: 1 },
    }),
    prisma.section.create({
      data: { tenantId: tenant.id, restaurantId: restaurant.id, name: "Bahçe", sortOrder: 2 },
    }),
    prisma.section.create({
      data: { tenantId: tenant.id, restaurantId: restaurant.id, name: "Teras", sortOrder: 3 },
    }),
  ]);

  // ── Masalar (her bölümden 4'er) ──
  const sections = [iceSalon, bahce, teras];
  for (const sec of sections) {
    for (let i = 1; i <= 4; i++) {
      await prisma.table.create({
        data: {
          tenantId: tenant.id,
          restaurantId: restaurant.id,
          sectionId: sec.id,
          label: `${sec.name.charAt(0)}-${i}`,
          capacity: 4,
          qrToken: qrToken(),
          status: TableStatus.EMPTY,
        },
      });
    }
  }

  // ── Kullanıcılar ──
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await prisma.user.createMany({
    data: [
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        username: "yonetici",
        email: "yonetici@lezzetkosesi.com",
        fullName: "Mehmet Yönetici",
        role: UserRole.OWNER,
        passwordHash,
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        username: "garson1",
        fullName: "Ali Garson",
        role: UserRole.WAITER,
        passwordHash,
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        username: "garson2",
        fullName: "Ayşe Garson",
        role: UserRole.WAITER,
        passwordHash,
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        username: "mutfak",
        fullName: "Hasan Şef",
        role: UserRole.KITCHEN,
        passwordHash,
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        username: "bar",
        fullName: "Selin Barmen",
        role: UserRole.BAR,
        passwordHash,
      },
    ],
  });

  // ── Kategoriler ──
  const corbalar = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: { TR: "Çorbalar", EN: "Soups" },
      station: StationType.KITCHEN,
      sortOrder: 1,
    },
  });

  const anaYemekler = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: { TR: "Ana Yemekler", EN: "Main Dishes" },
      station: StationType.KITCHEN,
      sortOrder: 2,
    },
  });

  const tatlilar = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: { TR: "Tatlılar", EN: "Desserts" },
      station: StationType.KITCHEN,
      sortOrder: 3,
    },
  });

  const icecekler = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: { TR: "İçecekler", EN: "Beverages" },
      station: StationType.BAR,
      sortOrder: 4,
    },
  });

  // ── Ürünler ──
  await prisma.product.createMany({
    data: [
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: corbalar.id,
        name: { TR: "Mercimek Çorbası", EN: "Lentil Soup" },
        description: { TR: "Geleneksel kırmızı mercimek çorbası", EN: "Traditional red lentil soup" },
        basePrice: 65,
        prepTimeMin: 5,
        tags: ["VEGAN"],
        allergens: [],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: corbalar.id,
        name: { TR: "Ezogelin Çorbası", EN: "Ezogelin Soup" },
        description: { TR: "Bulgur ve mercimekli yöresel çorba", EN: "Lentil and bulgur regional soup" },
        basePrice: 75,
        prepTimeMin: 5,
        tags: [],
        allergens: ["GLUTEN"],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: anaYemekler.id,
        name: { TR: "Adana Kebap", EN: "Adana Kebab" },
        description: { TR: "Acılı zırh kıymadan, közde", EN: "Spicy minced lamb on charcoal" },
        basePrice: 320,
        prepTimeMin: 20,
        tags: ["SPICY", "CHEF_PICK"],
        allergens: [],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: anaYemekler.id,
        name: { TR: "Izgara Köfte", EN: "Grilled Meatballs" },
        description: { TR: "Pirinç pilavı ve közlenmiş biber ile", EN: "Served with rice pilaf" },
        basePrice: 280,
        prepTimeMin: 15,
        tags: [],
        allergens: ["GLUTEN"],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: tatlilar.id,
        name: { TR: "Künefe", EN: "Kunefe" },
        description: { TR: "Antep fıstığı ile", EN: "With pistachio" },
        basePrice: 180,
        prepTimeMin: 8,
        tags: ["CHEF_PICK"],
        allergens: ["LACTOSE", "NUT"],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: tatlilar.id,
        name: { TR: "Sütlaç", EN: "Rice Pudding" },
        description: { TR: "Fırınlanmış geleneksel sütlaç", EN: "Baked traditional rice pudding" },
        basePrice: 120,
        prepTimeMin: 3,
        tags: [],
        allergens: ["LACTOSE"],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: icecekler.id,
        name: { TR: "Ayran", EN: "Ayran" },
        description: { TR: "Ev yapımı", EN: "Homemade" },
        basePrice: 35,
        prepTimeMin: 1,
        tags: [],
        allergens: ["LACTOSE"],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: icecekler.id,
        name: { TR: "Türk Kahvesi", EN: "Turkish Coffee" },
        description: { TR: "Lokum eşliğinde", EN: "Served with Turkish delight" },
        basePrice: 80,
        prepTimeMin: 5,
        tags: [],
        allergens: [],
      },
      {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        categoryId: icecekler.id,
        name: { TR: "Soda", EN: "Soda Water" },
        description: { TR: "Sade veya limonlu", EN: "Plain or lemon" },
        basePrice: 30,
        prepTimeMin: 1,
        tags: [],
        allergens: [],
        isAvailable: false, // "Tükendi" örneği
      },
    ],
  });

  console.log("✓ Seed completed.");
  console.log(`
  ┌─────────────────────────────────────────────┐
  │  Demo erişim bilgileri                      │
  ├─────────────────────────────────────────────┤
  │  Süper Admin                                 │
  │   email   : admin@sistemadi.com             │
  │   şifre   : ${DEMO_PASSWORD}                       │
  │                                              │
  │  Tenant   : lezzetkosesi                    │
  │                                              │
  │  Personel kullanıcı adları:                 │
  │   yonetici / garson1 / garson2 / mutfak / bar │
  │   tümünün şifresi: ${DEMO_PASSWORD}                 │
  └─────────────────────────────────────────────┘
  `);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
