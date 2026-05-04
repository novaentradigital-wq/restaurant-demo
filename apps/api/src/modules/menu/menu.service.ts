import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Müşteri QR'dan menüyü açtığında JWT yok — bu yüzden bu servis
 * RLS bypass ile çalışır (superuser bağlantı). Yine de çekilen veriler
 * her zaman bir tenantId/restoranla filtrelenir, bu yüzden sızıntı olmaz.
 */
@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /** QR token üzerinden masayı + restoranın menüsünü çek */
  async getByQrToken(qrToken: string): Promise<unknown> {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: {
        restaurant: {
          select: {
            id: true,
            tenantId: true,
            name: true,
            logoUrl: true,
            coverUrl: true,
            currency: true,
            defaultLang: true,
            socialLinks: true,
            openingHours: true,
          },
        },
        section: { select: { id: true, name: true } },
      },
    });
    if (!table || !table.isActive || !table.restaurant.id) {
      throw new NotFoundException("Masa bulunamadı veya aktif değil.");
    }

    const categories = await this.prisma.category.findMany({
      where: { restaurantId: table.restaurant.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            ingredients: true,
            basePrice: true,
            tags: true,
            allergens: true,
            isAvailable: true,
            images: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              select: { url: true, isPrimary: true },
            },
            variants: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, name: true, priceDelta: true, isDefault: true },
            },
          },
        },
      },
    });

    return {
      table: {
        id: table.id,
        label: table.label,
        section: table.section?.name,
      },
      restaurant: table.restaurant,
      categories,
    };
  }

  /** Ürün araması — QR menüde arama kutusu */
  async search(restaurantId: string, term: string): Promise<unknown> {
    if (term.trim().length < 2) return [];
    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT id, name, description, base_price as "basePrice", tags
        FROM products
        WHERE restaurant_id = ${restaurantId}::uuid
          AND is_active = TRUE
          AND search_vector @@ plainto_tsquery('simple', ${term})
        ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${term})) DESC
        LIMIT 30
      `
    );
  }
}
