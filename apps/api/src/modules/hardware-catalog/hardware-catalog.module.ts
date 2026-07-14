import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminHardwareCatalogController } from "./admin-hardware-catalog.controller";
import { HardwareCatalogController } from "./hardware-catalog.controller";
import { HardwareCatalogService } from "./hardware-catalog.service";

@Module({
  imports: [PrismaModule],
  controllers: [HardwareCatalogController, AdminHardwareCatalogController],
  providers: [HardwareCatalogService],
  exports: [HardwareCatalogService],
})
export class HardwareCatalogModule {}
