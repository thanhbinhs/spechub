import { Controller, Headers, Param, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { Public } from "../../common/decorators/public.decorator";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscription-webhooks")
@Controller("subscriptions/webhooks")
export class WebhooksController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Post(":provider")
  @ApiOperation({ summary: "Receive a signed subscription provider webhook" })
  @ApiParam({ name: "provider", example: "stripe" })
  handleWebhook(
    @Param("provider") provider: string,
    @Headers("stripe-signature") stripeSignature: string | undefined,
    @Req() request: FastifyRequest & { rawBody?: Buffer },
  ) {
    return this.subscriptionsService.handleWebhook(
      provider,
      request.rawBody,
      stripeSignature,
    );
  }
}
