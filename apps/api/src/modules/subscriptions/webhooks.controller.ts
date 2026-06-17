import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscription-webhooks")
@Controller("subscriptions/webhooks")
export class WebhooksController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get(":provider/status")
  @ApiOperation({ summary: "Subscription webhook scaffold status" })
  @ApiParam({ name: "provider", example: "stripe" })
  getWebhookStatus(@Param("provider") provider: string) {
    return this.subscriptionsService.getWebhookStatus(provider);
  }
}
