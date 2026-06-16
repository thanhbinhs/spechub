import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { BatteryUnitsController } from "./battery-units.controller";
import { BatteryUnitsService } from "./battery-units.service";

@Module({
  imports: [PrismaModule],
  controllers: [BatteryUnitsController],
  providers: [BatteryUnitsService],
  exports: [BatteryUnitsService],
})
export class BatteryUnitsModule {}
