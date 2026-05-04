import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { UserRole, TableStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { TablesService } from "./tables.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

class UpdateStatusDto {
  @IsEnum(TableStatus)
  status!: TableStatus;
}

@Controller("restaurants/:restaurantId/tables")
@UseGuards(RolesGuard)
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.CASHIER)
  list(@Param("restaurantId") restaurantId: string): Promise<unknown> {
    return this.tables.listForRestaurant(restaurantId);
  }

  @Patch(":tableId/status")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER)
  async setStatus(
    @Param("tableId") tableId: string,
    @Body() dto: UpdateStatusDto
  ): Promise<{ ok: true }> {
    await this.tables.setStatus(tableId, dto.status);
    return { ok: true };
  }
}
