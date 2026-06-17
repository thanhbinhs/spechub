import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { WishlistsService } from "./wishlists.service";

@ApiTags("wishlists")
@Controller("wishlists")
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get("status")
  @ApiOperation({ summary: "Wishlists module scaffold status" })
  getStatus() {
    return this.wishlistsService.getStatus();
  }
}
