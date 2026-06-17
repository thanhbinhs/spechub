import { Injectable } from "@nestjs/common";

@Injectable()
export class AlertsService {
  getStatus() {
    return {
      data: {
        module: "alerts",
        status: "scaffolded",
        active: false,
        next_steps: [
          "Define price alert DTOs",
          "Add authenticated CRUD endpoints",
          "Connect alerts to notification jobs",
        ],
      },
    };
  }
}
