import { Controller, Get, Param, Query } from "@nestjs/common";
import { MenuService } from "./menu.service";
import { Public } from "../auth/decorators/public.decorator";

@Controller("menu")
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  /** Müşteri tarafı: QR token ile menüyü aç */
  @Public()
  @Get("qr/:qrToken")
  byQr(@Param("qrToken") qrToken: string): Promise<unknown> {
    return this.menu.getByQrToken(qrToken);
  }

  /** Müşteri tarafı: arama */
  @Public()
  @Get("restaurants/:restaurantId/search")
  search(
    @Param("restaurantId") restaurantId: string,
    @Query("q") q: string
  ): Promise<unknown> {
    return this.menu.search(restaurantId, q ?? "");
  }
}
