import { Injectable } from "@nestjs/common";

@Injectable()
export class SubscriptionsService {
  getStatus() {
    return {
      data: {
        module: "subscriptions",
        status: "scaffolded",
        active: false,
        next_steps: [
          "Define subscription plan DTOs",
          "Add billing provider integration",
          "Implement webhook event processing",
        ],
      },
    };
  }

  getWebhookStatus(provider: string) {
    return {
      data: {
        module: "subscriptions",
        provider,
        status: "webhook scaffolded",
        active: false,
      },
    };
  }
}
