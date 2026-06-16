import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ChipsetsController } from "./chipsets.controller";
import { ChipsetsService } from "./chipsets.service";

@Module({
  imports: [PrismaModule],
  controllers: [ChipsetsController],
  providers: [ChipsetsService],
  exports: [ChipsetsService],
})
export class ChipsetsModule {}
