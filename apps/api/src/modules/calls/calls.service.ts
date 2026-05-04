import { Injectable, NotFoundException } from "@nestjs/common";
import { CallStatus, CallType, PaymentMethod, TableStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

interface CreateCallInput {
  qrToken: string;
  type: CallType;
  paymentHint?: PaymentMethod;
}

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  /** Müşteri çağırır (giriş yapmadan, QR token ile) */
  async createFromCustomer(input: CreateCallInput): Promise<{ id: string }> {
    const table = await this.prisma.table.findUnique({
      where: { qrToken: input.qrToken },
      select: { id: true, tenantId: true, restaurantId: true, isActive: true },
    });
    if (!table || !table.isActive) {
      throw new NotFoundException("Masa bulunamadı.");
    }

    const call = await this.prisma.tableCall.create({
      data: {
        tenantId: table.tenantId,
        restaurantId: table.restaurantId,
        tableId: table.id,
        type: input.type,
        paymentHint: input.paymentHint,
      },
      select: { id: true },
    });

    // Masa durumunu çağrı tipine göre güncelle
    const newStatus: TableStatus =
      input.type === CallType.BILL ? TableStatus.BILL_REQUESTED : TableStatus.CALL_WAITER;

    await this.prisma.table.update({
      where: { id: table.id },
      data: { status: newStatus },
    });

    this.realtime.emitToRestaurant(table.tenantId, table.restaurantId, "call.created", {
      callId: call.id,
      tableId: table.id,
      type: input.type,
      paymentHint: input.paymentHint,
      createdAt: new Date().toISOString(),
    });

    this.realtime.emitToRestaurant(
      table.tenantId,
      table.restaurantId,
      "table.status_changed",
      { tableId: table.id, status: newStatus }
    );

    return call;
  }

  /** Garson alındı işaretler */
  async acknowledge(callId: string, userId: string): Promise<void> {
    const updated = await this.prisma.forTenant(async (tx) =>
      tx.tableCall.update({
        where: { id: callId },
        data: {
          status: CallStatus.ACKNOWLEDGED,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        },
        select: { id: true, restaurantId: true, tenantId: true, tableId: true },
      })
    );
    this.realtime.emitToRestaurant(updated.tenantId, updated.restaurantId, "call.acknowledged", {
      callId: updated.id,
      tableId: updated.tableId,
    });
  }

  /** Çağrı tamamlandı (örn. garson masaya geldi) */
  async resolve(callId: string): Promise<void> {
    const updated = await this.prisma.forTenant(async (tx) =>
      tx.tableCall.update({
        where: { id: callId },
        data: { status: CallStatus.RESOLVED, resolvedAt: new Date() },
        select: { id: true, restaurantId: true, tenantId: true, tableId: true },
      })
    );
    this.realtime.emitToRestaurant(updated.tenantId, updated.restaurantId, "call.resolved", {
      callId: updated.id,
      tableId: updated.tableId,
    });
  }
}
