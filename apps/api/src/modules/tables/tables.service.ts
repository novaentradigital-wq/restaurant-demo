import { Injectable, NotFoundException } from "@nestjs/common";
import { TableStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { TenantContextService } from "../tenant/tenant-context.service";

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
    private readonly realtime: RealtimeGateway
  ) {}

  /** Salon planı: aktif masaları, oturumları, son çağrı durumlarıyla döner */
  async listForRestaurant(restaurantId: string): Promise<unknown> {
    return this.prisma.forTenant((tx) =>
      tx.table.findMany({
        where: { restaurantId, isActive: true },
        orderBy: [{ section: { sortOrder: "asc" } }, { label: "asc" }],
        include: {
          section: { select: { id: true, name: true, sortOrder: true } },
          sessions: {
            where: { closedAt: null },
            take: 1,
            select: { id: true, openedAt: true, totalAmount: true },
          },
          calls: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, type: true, createdAt: true },
          },
        },
      })
    );
  }

  async setStatus(tableId: string, status: TableStatus): Promise<void> {
    const ctx = this.tenantCtx.get();
    if (!ctx) throw new Error("No tenant context");

    const table = await this.prisma.forTenant(async (tx) => {
      const updated = await tx.table.update({
        where: { id: tableId },
        data: { status },
        select: { id: true, restaurantId: true, tenantId: true },
      });
      return updated;
    });
    if (!table) throw new NotFoundException("Masa bulunamadı.");

    this.realtime.emitToRestaurant(
      table.tenantId,
      table.restaurantId,
      "table.status_changed",
      { tableId: table.id, status }
    );
  }
}
