import { Injectable } from "@nestjs/common";

@Injectable()
export class WikiService {
  getStatus() {
    return {
      data: {
        module: "wiki",
        status: "scaffolded",
        active: false,
        next_steps: [
          "Define article and revision DTOs",
          "Add article CRUD endpoints",
          "Connect citations and moderation workflow",
        ],
      },
    };
  }
}
