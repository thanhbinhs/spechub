import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { DataIngestionController } from "./data-ingestion.controller";
import { DataIngestionService } from "./data-ingestion.service";

@Module({
  imports: [PrismaModule],
  controllers: [DataIngestionController],
  providers: [DataIngestionService],
  exports: [DataIngestionService],
})
export class DataIngestionModule {}
