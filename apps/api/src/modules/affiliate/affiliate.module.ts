import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AlertsModule } from "../alerts/alerts.module";
import { AffiliatePriceScheduler } from "./affiliate-price.scheduler";
import { AffiliateController } from "./affiliate.controller";
import { AffiliateService } from "./affiliate.service";
import { MarketplacePriceService } from "./marketplace-price.service";

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [AffiliateController],
  providers: [
    AffiliateService,
    MarketplacePriceService,
    AffiliatePriceScheduler,
  ],
  exports: [AffiliateService],
})
export class AffiliateModule {}
