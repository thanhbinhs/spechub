import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get("status")
  @ApiOperation({ summary: "Subscriptions module scaffold status" })
  getStatus() {
    return this.subscriptionsService.getStatus();
  }
}
