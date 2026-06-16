import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CameraModulesController } from "./camera-modules.controller";
import { CameraModulesService } from "./camera-modules.service";

@Module({
  imports: [PrismaModule],
  controllers: [CameraModulesController],
  providers: [CameraModulesService],
  exports: [CameraModulesService],
})
export class CameraModulesModule {}
