import { Injectable } from "@nestjs/common";

@Injectable()
export class AffiliateService {
  getStatus() {
    return {
      data: {
        module: "affiliate",
        status: "scaffolded",
        active: false,
        next_steps: [
          "Define affiliate partner and link DTOs",
          "Add click tracking endpoints",
          "Connect device variants to buy links",
        ],
      },
    };
  }
}
