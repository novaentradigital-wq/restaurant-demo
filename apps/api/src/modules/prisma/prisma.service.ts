import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { TenantContextService } from "../tenant/tenant-context.service";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * App-wide Prisma client.
 *
 *  • Migrations + seed superuser olarak koşar — RLS bypass.
 *  • Runtime istekleri `forTenant(fn)` üzerinden açılan transaction içinde
 *    çalışır; transaction başında `SET LOCAL app.tenant_id = '<uuid>'` atılır
 *    ve qrmenu_app rolü RLS politikalarını uygular.
 *  • Tenant ID, AsyncLocalStorage tabanlı `TenantContextService`'ten okunur,
 *    böylece servis metodlarına ekstra parametre geçirmek gerekmez.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly tenantCtx: TenantContextService) {
    super({
      log: process.env.NODE_ENV === "development"
        ? [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }]
        : [{ emit: "event", level: "error" }],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Prisma connected");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Geçerli istekteki tenant bağlamında bir transaction açar ve callback'e
   * tenant-aware bir Prisma client geçirir. RLS politikaları transaction
   * süresince zorlanır.
   */
  forTenant<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    const tenantId = this.tenantCtx.getTenantId();
    if (!tenantId) {
      throw new Error("forTenant() çağrıldı ama TenantContext boş — JWT kontrolünü atlatıyor olabilirsiniz.");
    }
    return this.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
      return fn(tx as unknown as TxClient);
    });
  }
}
