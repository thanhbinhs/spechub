import { Injectable } from "@nestjs/common";

@Injectable()
export class WishlistsService {
  getStatus() {
    return {
      data: {
        module: "wishlists",
        status: "scaffolded",
        active: false,
        next_steps: [
          "Define wishlist item DTOs",
          "Add authenticated list/add/remove endpoints",
          "Connect dashboard saved devices UI",
        ],
      },
    };
  }
}
