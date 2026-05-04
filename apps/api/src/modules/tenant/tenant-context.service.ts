import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

interface TenantContext {
  tenantId: string;
  userId: string;
  restaurantId: string | null;
}

/**
 * AsyncLocalStorage tabanlı request-scoped tenant bağlamı.
 * TenantContextInterceptor istek başında doldurur; PrismaService bunu okur.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  run<T>(ctx: TenantContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  get(): TenantContext | undefined {
    return this.als.getStore();
  }

  getTenantId(): string | undefined {
    return this.als.getStore()?.tenantId;
  }
}
