import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { DisplayUnitsController } from "./display-units.controller";
import { DisplayUnitsService } from "./display-units.service";

@Module({
  imports: [PrismaModule],
  controllers: [DisplayUnitsController],
  providers: [DisplayUnitsService],
  exports: [DisplayUnitsService],
})
export class DisplayUnitsModule {}
