import { Controller, Get } from "@nestjs/common";
import { Public } from "./modules/auth/decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check(): { status: string; ts: string } {
    return { status: "ok", ts: new Date().toISOString() };
  }
}
