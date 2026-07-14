import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WishlistsController } from "./wishlists.controller";
import { WishlistsService } from "./wishlists.service";

@Module({
  imports: [PrismaModule],
  controllers: [WishlistsController],
  providers: [WishlistsService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
