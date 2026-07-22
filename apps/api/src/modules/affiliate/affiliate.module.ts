import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AffiliateController } from "./affiliate.controller";
import { AffiliateService } from "./affiliate.service";
import { MarketplacePriceService } from "./marketplace-price.service";

@Module({
  imports: [PrismaModule],
  controllers: [AffiliateController],
  providers: [AffiliateService, MarketplacePriceService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
