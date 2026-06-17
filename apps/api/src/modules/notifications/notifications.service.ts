import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  getStatus() {
    return {
      data: {
        module: "notifications",
        status: "scaffolded",
        active: false,
        next_steps: [
          "Define notification DTOs",
          "Add in-app notification endpoints",
          "Connect email and push workers",
        ],
      },
    };
  }
}
