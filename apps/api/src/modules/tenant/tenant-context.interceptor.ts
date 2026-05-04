import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import type { Request } from "express";
import { TenantContextService } from "./tenant-context.service";

/**
 * Her HTTP isteğinde (kimliği doğrulanmışsa) tenant bağlamını ALS'ye yerleştirir.
 * Servisler `prisma.forTenant(...)` çağırırken tenantId buradan okunur.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantCtx: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user;
    if (!user) return next.handle();

    return new Observable((subscriber) => {
      this.tenantCtx.run(
        { tenantId: user.tenantId, userId: user.sub, restaurantId: user.restaurantId },
        () => {
          const sub = next.handle().subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
          return () => sub.unsubscribe();
        }
      );
    });
  }
}
