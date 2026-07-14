import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AlertsController } from "./alerts.controller";
import { PriceAlertsScheduler } from "./alerts.scheduler";
import { AlertsService } from "./alerts.service";

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService, PriceAlertsScheduler],
  exports: [AlertsService],
})
export class AlertsModule {}
