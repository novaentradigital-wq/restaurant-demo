import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { CallType, PaymentMethod, UserRole } from "@prisma/client";
import { CallsService } from "./calls.service";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";

class CustomerCallDto {
  @IsString()
  @MinLength(4)
  qrToken!: string;

  @IsEnum(CallType)
  type!: CallType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentHint?: PaymentMethod;
}

@Controller("calls")
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  /** Müşteri tarafı: QR ile çağrı oluştur */
  @Public()
  @Post()
  create(@Body() dto: CustomerCallDto): Promise<{ id: string }> {
    return this.calls.createFromCustomer(dto);
  }

  /** Garson çağrıyı aldı */
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER)
  @Post(":callId/acknowledge")
  async acknowledge(
    @Param("callId") callId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<{ ok: true }> {
    await this.calls.acknowledge(callId, user.sub);
    return { ok: true };
  }

  /** Garson masaya gitti, çağrı kapatıldı */
  @UseGuards(RolesGuard)
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER)
  @Post(":callId/resolve")
  async resolve(@Param("callId") callId: string): Promise<{ ok: true }> {
    await this.calls.resolve(callId);
    return { ok: true };
  }
}
